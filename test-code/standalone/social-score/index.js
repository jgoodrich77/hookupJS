'use strict';

var
util = require('util');

var
WEIGHT_HIGH = 3,
WEIGHT_MED  = 2,
WEIGHT_LOW  = 1,

TOTAL_FB_USERS = 1300000000; // est 1.3b active users (2014).

/**
*** Generic classes for score computation
**/

function Score(weights, scoreBase) {
  scoreBase = scoreBase || 10;

  if(!weights) {
    weights = [];
  }
  else if(!util.isArray(weights)) {
    weights = [weights];
  }

  this.maxWeight = function() {
    if(!weights.length) {
      return 0;
    }
    return weights.reduce(function (p, c) {
      if(! c instanceof ScoreWeight ) {
        return p;
      }

      return Math.max(p, parseInt(c.getWeight()));
    }, 0);
  };

  this.calculate = function() {
    if(!weights.length) {
      return 0;
    }

    var
    maxWeight     = this.maxWeight(),
    weightedScore = weights.reduce(function (p, c) {
      if(! c instanceof ScoreWeight ) {
        return p;
      }

      var
      relativeWeight = c.getWeight() / maxWeight, // weight of this particular scoring
      score = c.getScore();

      return p + (score * relativeWeight);
    }, 0);

    return scoreBase * (weightedScore / weights.length);
  };
}

function ScoreWeight(scoreValue, minScore, maxScore, weight) {
  weight     = parseInt(weight || WEIGHT_LOW);
  minScore   = parseFloat(minScore || 0);
  maxScore   = parseFloat(maxScore || 0);
  scoreValue = scoreValue || minScore;

  this.normalizeScore = function(v) {
    v = parseFloat(v);
    return v < minScore ? minScore : (v > maxScore ? maxScore : v);
  };
  this.getScore = function() {
    return this.normalizeScore(scoreValue) / maxScore;
  };
  this.getWeight = function() {
    return weight;
  };
}

function ScoreWeightPercent(v, weight) {
  ScoreWeight.apply(this, [v, 0, 100, weight || WEIGHT_LOW]);
}

util.inherits(ScoreWeightPercent, ScoreWeight);

function ScoreFacebookLikes(totalLikes) {
  ScoreWeight.apply(this, [totalLikes, 0, TOTAL_FB_USERS, WEIGHT_HIGH]);

  // console.log(
  //   'ScoreFacebookLikes:', this.getScore().toFixed(5)
  // );
}

util.inherits(ScoreFacebookLikes, ScoreWeight);

function ScoreFacebookLast3Posts(totalLikes, posts) {
  var
  weight = WEIGHT_HIGH;

  if(!posts) { // score automatic zero
    ScoreWeightPercent.apply(this, [0, weight]);
    return;
  }
  else if(!util.isArray(posts)) {
    posts = [posts];
  }

  var
  sumPostScore = posts.reduce(function (p, c, index) {

    var
    weightLike     = 1,
    weightShare    = 1.5,
    weightComment  = 0.5,
    weightCmtUniq  = 0.75,

    postLikes      = parseInt(c.likes || 0),
    postShares     = parseInt(c.shares || 0),
    postComments   = parseInt(c.comments || 0),
    postCmtUniq    = parseInt(c.commentsUnique || postComments || 0),

    ratioUniq      = (postComments / postCmtUniq),
    scoreLikes     = (postLikes    / totalLikes) * weightLike,
    scoreShares    = (postShares   / totalLikes) * weightShare,
    scoreComments  = (postComments / totalLikes) * weightComment,
    scoreCmtUniq   = (postCmtUniq  / totalLikes) * weightCmtUniq,
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

  ScoreWeightPercent.apply(this, [avgPostScore * 100, weight]);

  // console.log(
  //   'ScoreFacebookLast3Posts:', this.getScore().toFixed(5)
  // );
}

util.inherits(ScoreFacebookLast3Posts, ScoreWeightPercent);

var
scoreWords = [
  'The Extra Super Amazing Score of Awesomeness', // > 9
  'Extra Super Amazing',                          // > 8
  'Super Amazing',                                // > 7
  'Amazing',                                      // > 6
  'Cool',                                         // > 5
  'Ok',                                           // > 4
  'Kind of Sucks',                                // > 3
  'Really Sucks',                                 // > 2
  'Sucks Hard',                                   // > 1
  'Sucks Royally Hard',                           // > 0
  'Extreme Suckitude of Servility'                // = 0
].reverse(),

// play around with these percentages!
TEST_UNIQ_RATIO  = 0.9,
TEST_FB_LIKES    = Math.floor(TOTAL_FB_USERS   * 0.00000125),
TEST_P1_LIKES    = Math.floor(TEST_FB_LIKES    * 0.85),
TEST_P1_SHARES   = Math.floor(TEST_FB_LIKES    * 0.75),
TEST_P1_COMMENTS = Math.floor(TEST_FB_LIKES    * 0.95),
TEST_P1_COMMUNIQ = Math.floor(TEST_P1_COMMENTS * 0.95),
TEST_P2_LIKES    = Math.floor(TEST_FB_LIKES    * 0.85),
TEST_P2_SHARES   = Math.floor(TEST_FB_LIKES    * 0.95),
TEST_P2_COMMENTS = Math.floor(TEST_FB_LIKES    * 0.85),
TEST_P2_COMMUNIQ = Math.floor(TEST_P2_COMMENTS * 0.90),
TEST_P3_LIKES    = Math.floor(TEST_FB_LIKES    * 0.75),
TEST_P3_SHARES   = Math.floor(TEST_FB_LIKES    * 0.80),
TEST_P3_COMMENTS = Math.floor(TEST_FB_LIKES    * 0.85),
TEST_P3_COMMUNIQ = Math.floor(TEST_P3_COMMENTS * 0.92),

/**
*** Idea for scoring a facebook page.
**/
score = new Score([
  new ScoreFacebookLikes(TEST_FB_LIKES),
  new ScoreFacebookLast3Posts(TEST_FB_LIKES, [{
    likes: TEST_P1_LIKES,
    shares: TEST_P1_SHARES,
    comments: TEST_P1_COMMENTS,
    commentsUnique: TEST_P1_COMMUNIQ
  },{
    likes: TEST_P2_LIKES,
    shares: TEST_P2_SHARES,
    comments: TEST_P2_COMMENTS,
    commentsUnique: TEST_P2_COMMUNIQ
  },{
    likes: TEST_P3_LIKES,
    shares: TEST_P3_SHARES,
    comments: TEST_P3_COMMENTS,
    commentsUnique: TEST_P3_COMMUNIQ
  }])
]),
scoreCalc = score.calculate(),
scoreWord = scoreWords[Math.ceil(scoreCalc)];

console.log('Total Likes (%d)', TEST_FB_LIKES);
console.log('P1 Likes (%s) P1 Comments (%d) P1 Unique Comments (%d)', TEST_P1_LIKES, TEST_P1_COMMENTS, TEST_P1_COMMUNIQ);
console.log('P2 Likes (%s) P2 Comments (%d) P2 Unique Comments (%d)', TEST_P2_LIKES, TEST_P2_COMMENTS, TEST_P2_COMMUNIQ);
console.log('P3 Likes (%s) P3 Comments (%d) P3 Unique Comments (%d)', TEST_P3_LIKES, TEST_P3_COMMENTS, TEST_P3_COMMUNIQ);
console.log('----------------------')
console.log('Score (%s): %s', scoreCalc.toFixed(5), scoreWord);