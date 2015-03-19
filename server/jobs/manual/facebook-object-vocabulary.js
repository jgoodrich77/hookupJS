'use strict';

var
_ = require('lodash'),
Q = require('q'),
facebook = require('../../components/facebook'),
padLeft = require('../../components/utils/pad-left'),
qLoadPostEngagement = require('../common/load-post-engagement'),
qLoadUserObjectInfo = require('../common/load-user-info'),
Vocabulary = require('../../api/vocabulary/vocabulary.model');

var
natural = require('natural'),
stemmer   = natural.PorterStemmer,
kwExtract = require('keyword-extractor');

var
NUM_POSTS = 20,
TOP_WORDS = 50;

function getStems(text) {
  var
  words = kwExtract.extract(text),
  vset  = {};

  words.forEach(function (word) {
    var root = stemmer.stem(word);

    if(vset[root] === undefined) {
      vset[root] = [];
    }

    vset[root].push(word);
  });

  return vset;
}

function preprocessQuotes(text, preprocessed) {
  preprocessed = preprocessed || {};
  preprocessed.text = text || '';

  var
  regexp = /"((?:\\.|[^"\\])*)"/g,
  matches = preprocessed.text.match(regexp);

  if(!!matches && matches.length > 0) { // separate the links from the text
    matches.forEach(function (match) {
      preprocessed.text = preprocessed.text.replace(match, '');
    });
  }

  preprocessed.quotes = (matches||[]).map(function (str) {
    return str.replace(/"/g, '');
  });

  return preprocessed;
}

function preprocessLinks(text, preprocessed) {
  preprocessed = preprocessed || {};
  preprocessed.text = text || '';

  var
  regexp = /(https?\:\/\/[a-z0-9\-\.]+\.[a-z]{2,3}(\/\S*)?)/ig,
  matches = preprocessed.text.match(regexp);

  if(!!matches && matches.length > 0) { // separate the links from the text
    matches.forEach(function (match) {
      preprocessed.text = preprocessed.text.replace(match, '');
    });
  }

  preprocessed.links = matches || [];

  return preprocessed;
}

function preprocessHashtags(text, preprocessed) {
  preprocessed = preprocessed || {};
  preprocessed.text = text || '';

  var
  regexp = /\#[a-z0-9\-\_]+/ig,
  matches = preprocessed.text.match(regexp);

  if(!!matches && matches.length > 0) { // separate the links from the text
    matches.forEach(function (match) {
      preprocessed.text = preprocessed.text.replace(match, '');
    });
  }

  preprocessed.hashTags = matches || [];

  return preprocessed;
}

function preprocessText(text, preprocessed) {
  preprocessed = preprocessed || {};
  preprocessed.text = text || '';
  preprocessed.text = preprocessed.text.toLowerCase(); // convert all to lowercase
  preprocessed.text = preprocessed.text.replace(/[^a-z0-9'-]+/ig, ' '); // turn non-alpha into spaces
  preprocessed.text = preprocessed.text.replace(/[^a-z0-9 ]+/ig,  ''); // turn non-alpha (and space) into blanks
  preprocessed.text = preprocessed.text.trim();
  return preprocessed;
}

function preprocessStemming(text, preprocessed) {
  preprocessed = preprocessed || {};
  preprocessed.text = text || '';
  preprocessed.stems = getStems(preprocessed.text);
  return preprocessed;
}

function preprocess(m) {
  // console.log('message:', m);

  var
  processed = preprocessLinks(m);
  processed = preprocessQuotes(processed.text,   processed);
  processed = preprocessHashtags(processed.text, processed);
  processed = preprocessText(processed.text,     processed);
  processed = preprocessStemming(processed.text, processed);

  return processed;
}

function loadPostData(objectId, pageToken) {
  return facebook.pagePosts(objectId, pageToken, NUM_POSTS)
    .then(function (posts) {
      return qLoadPostEngagement(posts.data, pageToken);
    });
}

function assembleVocabulary (postData) {
  var
  vocab = {},
  markVocab = function (root, variation, shares, comments, likes) {

    var
    v = vocab[root] = vocab[root] || {
      root: root,
      variations: [],
      comments: 0,
      likes: 0,
      shares: 0
    };

    if(_.isArray(variation)) {
      Array.prototype.push.apply(v.variations, _.uniq(variation)
        .filter(function (word) { // include unique variations:
          return v.variations.indexOf(word) === -1;
        })
      );
    }
    else if(v.variations.indexOf(variation) === -1) {
      v.variations.push(variation);
    }

    v.shares   += shares;
    v.comments += comments;
    v.likes    += likes;

    if(!v.variations || !v.variations.length) {
      delete vocab[root];
    }
  };

  (postData||[]).forEach(function (post) {

    var
    message      = post.message || '',
    likeCount    = post.totalLikes || 0,
    shareCount   = post.totalShares || 0,
    commentCount = post.totalComments || 0,
    timestamp    = new Date(post.created_time);

    if(!message) return;

    var
    preprocessed = preprocess(message);

    ['quotes','links','hashTags'].forEach(function (ppKey) {
      preprocessed[ppKey].forEach(function (ppData) {
        markVocab(ppData, ppData, shareCount, commentCount, likeCount);
      });
    });

    Object.keys(preprocessed.stems)
      .forEach(function (stem) {
        markVocab(stem, preprocessed.stems[stem], shareCount, commentCount, likeCount);
      });
  });

  var
  vocabKeys = Object.keys(vocab),
  vkSorted  = vocabKeys.slice()
    .sort(function (a, b) {
      var mA = vocab[a], mB = vocab[b];

      // if(mA.shares > mB.shares) return -1;
      // if(mA.shares < mB.shares) return  1;
      // if(mA.comments > mB.comments) return -1;
      // if(mA.comments < mB.comments) return  1;
      if(mA.likes > mB.likes) return -1;
      if(mA.likes < mB.likes) return  1;
      return 0;
    });

  return vkSorted
    .map(function (stem) {
      return vocab[stem];
    });
}

module.exports = function(job, done) {
  var
  jobData  = job.attrs.data = (job.attrs.data || {}),
  promise  = Q(jobData),
  userId   = jobData.userId,
  objectId = jobData.facebookObjectId;

  return promise
    .then(function (buffer) {
      if(!userId)   throw new Error('No user ID was provided.');
      if(!objectId) throw new Error('No object ID was provided.');

      return qLoadUserObjectInfo(userId, objectId)
        .then(function (objectInfo) {
          if(!objectInfo.pageToken) throw new Error('No object token could be obtained.');
          return loadPostData(objectId, objectInfo.pageToken);
        })
        .then(assembleVocabulary)
        .then(function (vocabulary) {
          // console.log('built vocab:', vocabulary);
          return Q.nfcall(Vocabulary.create.bind(Vocabulary), {
            facebookObjectId: objectId,
            words: vocabulary.slice(0, TOP_WORDS) // only TOP_WORDS
          });
        })
        .then(function (doc) {
          buffer.vocabularyDoc = String(doc._id);
          return doc;
        });
    })
    .then(function (result) {
      done();
      return result;
    })
    .catch(done);
};