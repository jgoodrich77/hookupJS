'use strict';

var
util = require('util'),
ScoreWeight = require('./score-weight'),
ScorePercent = require('./score-percent'),
FbConsts = require('./const-facebook');

function ScoreFacebookLast3Posts(totalLikes, posts) {
  var
  weight = ScoreWeight.WEIGHT_HIGH;

  if(!posts) { // score automatic zero
    ScorePercent.apply(this, [0, weight]);
    return;
  }
  else if(!util.isArray(posts)) {
    posts = [posts];
  }

  var
  sumPostScore = posts.reduce(function (p, c, index) {

    var
    postLikes      = parseInt(c.likes || 0),
    postShares     = parseInt(c.shares || 0),
    postComments   = parseInt(c.comments || 0),
    postCmtUniq    = parseInt(c.commentsUnique || postComments || 0),

    ratioUniq      = (postComments / postCmtUniq),
    scoreLikes     = (postLikes    / totalLikes) * FbConsts.WEIGHT_LIKE,
    scoreShares    = (postShares   / totalLikes) * FbConsts.WEIGHT_SHARE,
    scoreComments  = (postComments / totalLikes) * FbConsts.WEIGHT_COMMENT,
    scoreCmtUniq   = (postCmtUniq  / totalLikes) * FbConsts.WEIGHT_COMMENT_UNIQUE,
    scorePost      = (
        scoreLikes
      + scoreShares
      + scoreComments
      + scoreCmtUniq
    ) / 4;

    // possibly factor score on commentPerUser ratio?
    // console.log('\n-- POST %d\n------------------------------------------', index + 1);
    // console.log('ratioUniq:       %s', ratioUniq.toFixed(5));
    // console.log('scoreLikes:      %s', scoreLikes.toFixed(5));
    // console.log('scoreShares:     %s', scoreShares.toFixed(5));
    // console.log('scoreComments:   %s', scoreComments.toFixed(5));
    // console.log('scoreCmtUniq:    %s', scoreCmtUniq.toFixed(5));
    // console.log('scorePost ====== %s', scorePost.toFixed(5));

    return p + scorePost;
  }, 0),
  avgPostScore = (sumPostScore / posts.length);

  ScorePercent.apply(this, [avgPostScore * 100, weight]);

  // console.log(
  //   'ScoreFacebookLast3Posts:', this.getScore().toFixed(5)
  // );
}

util.inherits(ScoreFacebookLast3Posts, ScorePercent);

module.exports = ScoreFacebookLast3Posts;