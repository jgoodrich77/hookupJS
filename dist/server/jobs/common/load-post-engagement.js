'use strict';

var
Q        = require('q'),
facebook = require('../../components/facebook');

function qPostEngagement(posts, accessToken) {
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

module.exports = qPostEngagement;