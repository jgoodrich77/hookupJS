'use strict';

/**
*** Generic classes for score computation
**/

var
Score                   = require('./lib/score'),
ScoreFacebookLikes      = require('./lib/score-facebook-likes'),
ScoreFacebookLast3Posts = require('./lib/score-facebook-last3posts'),
totalFbUsers            = require('./lib/const-facebook').TOTAL_FB_USERS;

/**
*** Test implementation
**/

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
TEST_FB_LIKES    = Math.floor(totalFbUsers     * 0.00000125),
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