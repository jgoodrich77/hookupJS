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
ScorePosts = require('./lib/score-posts');

function qValidateToken(token, accessToken) {
  return facebook.tokenInfo(token, accessToken)
    .then(function (result) {
      var tokenData = result.data;
      console.log('token information:', tokenData);
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

module.exports = {
  startScoring: function(fbScoreDoc) {
    var
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

      // check this token, and see if it's still valid:
      qValidateToken(objectAccessToken, owner.facebook.token)
        .then(function (valid) {
          if(!valid) {
            throw new Error(util.format('The token supplied for object (%s) is not valid (or has expired).', objectId));
          }

          //
          // load prerequisite scoring data
          //

          var
          scoreWeights = {};

          return facebook.pageLikes(objectId, objectAccessToken)
            .then(function (data) {
              scoreWeights.likes = new ScoreLikes(data);
              return facebook.pagePosts(objectId, objectAccessToken, 10);
            })
            .then(function (posts) {
              return qExtraPostData(posts.data, objectAccessToken);
            })
            .then(function (rows) {
              scoreWeights.posts = new ScorePosts(scoreWeights.likes, rows);
              return scoreWeights;
            });
        })
        .then(function (scoreWeights) {

          //
          // analyze score data
          //

          // console.log('Score (Likes): %s (i: %d)',
          //   scoreWeights.likes.compute().toFixed(10),
          //   scoreWeights.likes.getImportance()
          // );

          // console.log('Score (Posts): %s (i: %d)',
          //   scoreWeights.posts.compute().toFixed(10),
          //   scoreWeights.posts.getImportance()
          // );

          var
          score = new Score([ // produce a final score
            scoreWeights.likes,
            scoreWeights.posts
          ]).compute();

          // save this for optional use later.
          scoreWeights.total = score;

          fbScoreDoc.markFinished({
            score: score
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
    defer = Q.defer(),
    startScoring = this.startScoring;

    FacebookScore.findByStatus(FacebookScore.STATUS_RUNNING, function (err, docs) {
      if(err) return defer.reject(err);
      if(!docs.length) return defer.resolve([]);

      defer.resolve(docs.map(startScoring));
    });

    return defer.promise;
  },
  registerObject: function(owner, id, token) {
    var startScoring = this.startScoring;
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