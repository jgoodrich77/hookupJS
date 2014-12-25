'use strict';

var
util = require('util'),
Q = require('q'),
User = require('../../api/user/user.model'),
facebookScore = require('../../components/facebook-score'),
facebook = require('../../components/facebook');

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

function qLoadUserObjectInfo(userId, objectId) {
  var userToken, pageToken, foundInfo = false;

  return Q.nfcall(User.findById.bind(User), userId)
    .then(function (doc) {
      if(!doc)
        throw new Error('Could not find user.');

      if(!doc.facebook || !doc.facebook.token)
        throw new Error('User has no facebook token set.');

      userToken = doc.facebook.token;

      // load accounts that belong to this user token
      return facebook.userObjects(userToken);
    })
    .then(function (userObjects) {

      if(!userObjects || !userObjects.length)
        throw new Error('Unable to load any user objects, possibly a bad user token.');

      // find user's page object (to get token)
      userObjects.every(function (v) {

        if(v.id === objectId) {
          foundInfo = v;
          return false;
        }

        return true;
      });

      if(!foundInfo)
        throw new Error('Could not find user object in accounts.');

      return {
        ownerToken: userToken,
        pageToken: foundInfo.access_token
      };
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