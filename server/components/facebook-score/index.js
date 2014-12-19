'use strict';

var
Q = require('q'),
util = require('util'),
Score = require('../score'),
facebook = require('../facebook');

var // required models:
//FacebookObjs = require('../../api/facebook/facebook.model'),
User = require('../../api/user/user.model'),
FacebookScore = require('../../api/facebook/score/score.model'),
ScoreLikes = require('./lib/score-likes'),
ScorePosts = require('./lib/score-posts'),
ScorePostFreq = require('./lib/score-post-freq');

function qValidateToken(token, accessToken) {
  return facebook.tokenInfo(token, accessToken)
    .then(function (result) {
      var tokenData = result.data;
      // console.log('token information:', tokenData);
      return !!tokenData.is_valid;
    });
}

function qExtraPostData(posts, accessToken) {
  var
  result = Q(posts);

  for(var i = 0; i < posts.length; i++) {
    result = result.then((function (index) {
      return function (all) {
        var post = all[index];
        return Q.allSettled([
          facebook.postTotalLikes(post.id, accessToken),
          facebook.postTotalComments(post.id, accessToken),
          facebook.postTotalShares(post.id, accessToken)
        ]).spread(function (pLikes, pComments, pShares) {
          var
          likes    = !!pLikes.value    ? pLikes.value    : 0,
          comments = !!pComments.value ? pComments.value : 0,
          shares   = !!pShares.value   ? pShares.value   : 0;

          // attach these properties to the post object directly
          all[index].totalLikes    = likes;
          all[index].totalComments = comments;
          all[index].totalShares   = shares;

          return all;
        });
      };
    })(i));
  }

  return result;
}

function qAllPageData(ownerToken, objectId, objectAccessToken) {

  // check this token, and see if it's still valid:
  return qValidateToken(objectAccessToken, ownerToken)
    .then(function (valid) {
      if(!valid) {
        throw new Error(util.format('The token supplied for object (%s) is not valid (or has expired).', objectId));
      }

      var
      data = {};

      return facebook.pageLikes(objectId, objectAccessToken)
        .then(function (result) {
          data.likes = result; // buffer this
          return facebook.pagePosts(objectId, objectAccessToken, 10);
        })
        .then(function (result) {
          return qExtraPostData(result.data, objectAccessToken);
        })
        .then(function (result) {
          data.posts = result; // buffer this
          return data;
        });
    });
}

module.exports = {

  //
  // analyze score data
  //
  calculateScore: function(data) {

    // console.log(JSON.stringify(data, 0, 2));

    var scoreLikes = new ScoreLikes(data.likes);

    return new Score([ // produce a final score
      scoreLikes,
      new ScorePosts(scoreLikes, data.posts),
      new ScorePostFreq(data.posts)
    ]);
  },
  //
  // complete scoring process for a page
  //
  startScoring: function(fbScoreDoc) {
    var
    me    = this,
    defer = Q.defer(),
    started = Date.now(),
    ownerId = fbScoreDoc.owner._id || fbScoreDoc.owner,
    bInfo = fbScoreDoc.pageInfo;

    var
    objectId = fbScoreDoc.fbObjectId,
    objectAccessToken = fbScoreDoc.fbObjectAccessToken;

    console.log('Starting Scoring (%j)', bInfo);

    User.findById(ownerId, function (err, owner) {
      if(err) return defer.reject(err);
      if(!owner) return defer.reject(new Error('Object owner could not be located.'));

      if(!owner.facebook || !owner.facebook.token)
        return defer.reject(new Error('User has no stored facebook token.'));

      return qAllPageData(owner.facebook.token, objectId, objectAccessToken)
        .then(function (data) {

          var
          finalScore = me.calculateScore(data);

          fbScoreDoc.markFinished({
            score: finalScore.compute(),
            explained: finalScore.explain()
          });

          return  Q.nfcall(fbScoreDoc.save.bind(fbScoreDoc))
            .then(function (savedDoc) {
              defer.resolve(fbScoreDoc);
              return savedDoc;
            });
        })
        .catch(function (err) {
          defer.reject(err);
          return err;
        });
    });

    return defer.promise
      .then(function (result) {
        console.log('Finished Scoring (%j)\n-- result: %j\n-- duration: %dms', bInfo, result.currentStatus, Date.now() - started);
        return result;
      });
  },
  checkZombies: function() { // meant to be run once on start up
    var
    me = this,
    defer = Q.defer(),
    startScoring = this.startScoring;

    FacebookScore.findByStatus(FacebookScore.STATUS_RUNNING, function (err, docs) {
      if(err) return defer.reject(err);
      if(!docs.length) return defer.resolve([]);

      defer.resolve(docs.map(startScoring.bind(me)));
    });

    return defer.promise;
  },
  registerObject: function(owner, id, token) {
    var startScoring = this.startScoring.bind(this);
    return facebook.pageInfo(id, token)
      .then(function (pageInfo) {
        if(!pageInfo) throw new Error('No page information was returned from Facebook.');

        var
        defer = Q.defer();

        FacebookScore.findOneAndUpdate(
          { fbObjectId: id },
          {
            fbObjectId: id,
            fbObjectAccessToken: token,
            pageDetail: pageInfo,
            owner: owner
          },
          { upsert: true },
          function (err, doc) {
            if(err)  return defer.reject(err);
            if(!doc) return defer.reject(new Error('Unable to allocate a FacebookScore object.'));

            if(doc.markStarted()) {
              doc.save(function (err, doc) {
                if(err)  return defer.reject(err);
                defer.resolve(doc.currentStatus);

                startScoring(doc); // create a new scoring process (parallel)
              });
            }
            else {
              defer.resolve(doc.currentStatus);
            }
          }
        );

        return defer.promise;
      });
  },
  objectStatus: function(id) {
    var defer = Q.defer();

    FacebookScore.findByObjectId(id, function (err, doc) {
      if(err) return defer.reject(err);
      defer.resolve(!!doc ? doc.currentStatus : false);
    });

    return defer.promise;
  }
};