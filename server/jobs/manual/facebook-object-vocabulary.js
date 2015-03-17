'use strict';

var
_ = require('lodash'),
Q = require('q'),
natural = require('natural'),
facebook = require('../../components/facebook'),
padLeft = require('../../components/utils/pad-left'),
qLoadPostEngagement = require('../common/load-post-engagement'),
qLoadUserObjectInfo = require('../common/load-user-info'),
Vocabulary = require('../../api/vocabulary/vocabulary.model');

var
NUM_POSTS = 50,
TOP_WORDS = 50,
metaphone = natural.Metaphone,
tokenizer = new natural.WordPunctTokenizer(),
stemmer   = natural.PorterStemmer;

function getStems(str, ignoreDups) {
  str = str || '';

  var
  stemmedTokens = stemmer.tokenizeAndStem(str),
  extractTokens = tokenizer.tokenize(str);

  return _.uniq(stemmedTokens).reduce(function (p, stem, index) {
    p[stem] = [];

    extractTokens.forEach(function (token) {

      //if(natural.JaroWinklerDistance(stem, token) > 0.8) {
      if((token.substring(0, stem.length) === stem || metaphone.compare(token, stem)) && p[stem].indexOf(token) === -1) {
        p[stem].push(token);
      }
    });

    return p;
  }, {});
}

function preprocess(m) {
  var
  norm = (m||'').toLowerCase();
  norm = norm.replace(/[^a-z0-9'-]+/ig, ' '); // turn non-alpha into spaces
  norm = norm.replace(/[^a-z0-9 ]+/ig, ''); // turn non-alpha (and space) into blanks
  return norm.trim();
}


function loadPostData(objectId, pageToken) {
  return facebook.pagePosts(objectId, pageToken, NUM_POSTS)
    .then(function (posts) {
      return qLoadPostEngagement(posts.data, pageToken);
    });
}

function assembleVocabulary (postData) {
  var
  vocab = {};

  (postData||[]).forEach(function (post) {

    var
    message      = post.message || '',
    likeCount    = post.totalLikes || 0,
    shareCount   = post.totalShares || 0,
    commentCount = post.totalComments || 0,
    timestamp    = new Date(post.created_time);

    if(!message) return;

    var
    stemmed = getStems(preprocess(message));

    Object.keys(stemmed)
      .forEach(function (stem) {
        var
        vstem = vocab[stem] = vocab[stem] || {
          root: stem,
          variations: [],
          comments: 0,
          likes: 0,
          shares: 0
        };

        Array.prototype.push.apply(vstem.variations, stemmed[stem]
          .filter(function (word) { // include unique variations:
            return vstem.variations.indexOf(word) === -1;
          }));

        vstem.comments += commentCount;
        vstem.likes    += likeCount;
        vstem.shares   += shareCount;
      });
  });

  var
  vocabKeys = Object.keys(vocab),
  vkSorted  = vocabKeys.slice()
    .sort(function (a, b) {
      var mA = vocab[a], mB = vocab[b];

      if(mA.shares > mB.shares) return -1;
      if(mA.shares < mB.shares) return  1;
      if(mA.comments > mB.comments) return -1;
      if(mA.comments < mB.comments) return  1;
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