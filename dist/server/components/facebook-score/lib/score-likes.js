'use strict';

var
util = require('util'),
FbConsts = require('./consts'),
Score = require('../../score'),
Scale = require('../../scale'),
Weight = Score.Weight;

function ScoreFacebookLikes(likeData) {
  likeData = likeData || {};

  var
  LABEL = 'Page',
  PRECISION = 10,
  fbTotal  = FbConsts.TOTAL_FB_USERS * 0.01,

  // importances
  iLike    = 0.85,
  iNewLike = 0.95,
  iTalking = 0.85,
  iVisited = 0.75,

  // values
  vLike    = parseInt(likeData.likes || 0),
  vNewLike = parseInt(likeData.new_like_count || 0),
  vTalking = parseInt(likeData.talking_about_count || 0),
  vVisited = parseInt(likeData.were_here_count || 0);

  function scoreTotalLikes(totalLikes, fbTotal) {
    var scale = new Scale(0, fbTotal, 0, 1, 'quadIn', PRECISION);
    return scale.calculate(totalLikes);
  }

  function scoreNewLikes(newLikes, totalLikes) {
    var scale = new Scale(0, totalLikes + 1, 0, 1, 'quadOut', PRECISION);
    return scale.calculate(newLikes);
  }

  function scoreTalkingAbout(talkingAbout, totalLikes) {
    var scale = new Scale(0, totalLikes + 1, 0, 1, 'quadOut', PRECISION);
    return scale.calculate(talkingAbout);
  }

  function scoreVisited(visited, totalLikes) {
    var scale = new Scale(0, totalLikes + 1, 0, 1, 'quadOut', PRECISION);
    return scale.calculate(visited);
  }

  // console.log('   vLike:', vLike);
  // console.log('vNewLike:', vNewLike);
  // console.log('vTalking:', vTalking);
  // console.log('vVisited:', vVisited);

  // store this info publically for other tests to use
  this.totalLikes   = vLike;
  this.newLikes     = vNewLike;
  this.talkingAbout = vTalking;
  this.visited      = vVisited;

  if(vLike < 1000) {
    Score.call(this, false, LABEL);
    return;
  }

  var
  scoreTLL = scoreTotalLikes(this.totalLikes, fbTotal),
  scoreTNL = scoreNewLikes(vNewLike, vLike),
  scoreTTA = scoreTalkingAbout(vTalking, vLike),
  scoreTLV = scoreVisited(vVisited, vLike);

  Score.call(this, [
    new Weight(scoreTLL, 0, 1, iLike,    'page-likes'),
    new Weight(scoreTNL, 0, 1, iNewLike, 'page-new-likes'),
    new Weight(scoreTTA, 0, 1, iTalking, 'page-talking'),
    new Weight(scoreTLV, 0, 1, iVisited, 'page-visited')
  ], LABEL);
}

util.inherits(ScoreFacebookLikes, Score);

module.exports = ScoreFacebookLikes;