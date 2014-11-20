'use strict';

var
util = require('util'),
ScoreWeight = require('./score-weight'),
totalFbUsers = require('./const-facebook').TOTAL_FB_USERS;

function ScoreFacebookLikes(totalLikes) {
  ScoreWeight.apply(this, [totalLikes, 0, totalFbUsers, ScoreWeight.WEIGHT_HIGH]);

  // console.log(
  //   'ScoreFacebookLikes:', this.getScore().toFixed(5)
  // );
}

util.inherits(ScoreFacebookLikes, ScoreWeight);

module.exports = ScoreFacebookLikes;