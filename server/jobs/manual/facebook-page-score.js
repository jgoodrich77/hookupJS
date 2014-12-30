'use strict';

var
util = require('util'),
Q = require('q'),
User = require('../../api/user/user.model'),
facebookScore = require('../../components/facebook-score'),
facebook = require('../../components/facebook');

var
qLoadUserObjectInfo = require('../common/load-user-info');

function qValidateToken(token, accessToken) {
  return facebook.tokenInfo(token, accessToken)
    .then(function (result) {
      return !!result.data.is_valid;
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

function produceScore(data) {
  var finalScore = facebookScore.calculateScore(data);

  return {
    score: finalScore.compute(),
    explained: finalScore.explain()
  };
}

module.exports = function(job, done) {

  var
  jobData  = job.attrs.data = (job.attrs.data || {}),
  userId   = jobData.userId,
  objectId = jobData.facebookObjectId;

  return qLoadUserObjectInfo(userId, objectId)
    .then(function (objectInfo) {
      return qAllPageData(objectInfo.ownerToken, objectId, objectInfo.pageToken);
    })
    .then(function (pageData) {
        jobData.result = produceScore(pageData);
        done();
        return jobData;
    })
    .catch(done);
};