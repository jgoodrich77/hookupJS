'use strict';

var
util = require('util'),
FbConsts = require('./consts'),
Score = require('../../score'),
Weight = Score.Weight;

function ScoreFacebookLikes(likeData) {
  likeData = likeData || {};

  var
  fbTotal  = FbConsts.TOTAL_FB_USERS,

  // importances
  iLike    = 0.75,
  iNewLike = 0.85,
  iTalking = 0.95,
  iVisited = 0.99,

  // values
  vLike    = parseInt(likeData.likes || 0),
  vNewLike = parseInt(likeData.new_like_count || 0),
  vTalking = parseInt(likeData.talking_about_count || 0),
  vVisited = parseInt(likeData.were_here_count || 0);

  // store this info publically for other tests to use
  this.totalLikes   = vLike;
  this.newLikes     = vNewLike;
  this.talkingAbout = vTalking;
  this.visited      = vVisited;

  var
  score = new Score([
    new Weight(vLike,    0, fbTotal, iLike),
    new Weight(vNewLike, 0, fbTotal, iNewLike),
    new Weight(vTalking, 0, fbTotal, iTalking),
    new Weight(vVisited, 0, fbTotal, iVisited)
  ]).compute();

  Weight.apply(this, [score, 0, 1, 0.95]);
}

util.inherits(ScoreFacebookLikes, Weight);

module.exports = ScoreFacebookLikes;