'use strict';

var
util = require('util'),
ScoreWeight = require('./score-weight');

function ScoreWeightPercent(v, weight) {
  ScoreWeight.apply(this, [v, 0, 100, weight || ScoreWeight.WEIGHT_LOW]);
}

util.inherits(ScoreWeightPercent, ScoreWeight);

module.exports = ScoreWeightPercent;