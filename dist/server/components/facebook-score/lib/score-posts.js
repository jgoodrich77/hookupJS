'use strict';

var
util = require('util'),
FbConsts = require('./consts'),
Score = require('../../score'),
Scale = require('../../scale'),
Weight = Score.Weight;

function ScoreFacebookPosts(scoreLikes, posts) {
  posts = posts || [];

  var
  LABEL = 'Posts',
  totalLikes = scoreLikes.totalLikes,
  PRECISION = 10;

  function computePostLikes(postLikes, pageLikes) {
    var scale = new Scale(0, pageLikes, 0, 1, 'quadOut', PRECISION);
    return scale.calculate(postLikes);
  }

  function computePostComments(postComments, pageLikes) {
    var scale = new Scale(0, pageLikes, 0, 1, 'quadOut', PRECISION);
    return scale.calculate(postComments);
  }

  function computePostShares(postShares, pageLikes) {
    var scale = new Scale(0, pageLikes, 0, 1, 'quadOut', PRECISION);
    return scale.calculate(postShares);
  }

  function scorePost(p) {

    var
    // importances
    iLike        = 0.75,
    iComment     = 0.85,
    iShare       = 0.99,
    // seeded by caller
    postLikes    = p.totalLikes,
    postComments = p.totalComments,
    postShares   = p.totalShares,

    // facebook core:
    postId       = p.id,
    postLUpdate  = p.updated_time;

    var
    scoreTPL = computePostLikes(postLikes, totalLikes),
    scoreTPC = computePostComments(postComments, totalLikes),
    scoreTPS = computePostShares(postShares, totalLikes)

    return new Score([
      new Weight(scoreTPL, 0, 1, iLike,    'post-likes'),
      new Weight(scoreTPC, 0, 1, iComment, 'post-comments'),
      new Weight(scoreTPS, 0, 1, iShare,   'post-shares')
    ], postId);
  }

  if(!posts || !posts.length) {
    Score.call(this, false, LABEL);
  }
  else {
    Score.call(this, posts.map(scorePost), LABEL);
  }
}

util.inherits(ScoreFacebookPosts, Score);

module.exports = ScoreFacebookPosts;