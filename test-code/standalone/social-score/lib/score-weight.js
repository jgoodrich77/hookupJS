'use strict';

var
_ = require('lodash');

var
WEIGHT_HIGH = 3,
WEIGHT_MED  = 2,
WEIGHT_LOW  = 1;

function ScoreWeight(scoreValue, minScore, maxScore, weight) {
  weight     = parseInt(weight || WEIGHT_LOW);
  minScore   = parseFloat(minScore || 0);
  maxScore   = parseFloat(maxScore || 0);
  scoreValue = scoreValue || minScore;

  _.extend(this, {
    normalizeScore: function(v) {
      v = parseFloat(v);
      return v < minScore ? minScore : (v > maxScore ? maxScore : v);
    },
    getScore: function() {
      return this.normalizeScore(scoreValue) / maxScore;
    },
    getWeight: function() {
      return weight;
    }
  });
}

_.extend(ScoreWeight, {
  WEIGHT_HIGH: WEIGHT_HIGH,
  WEIGHT_MED:  WEIGHT_MED,
  WEIGHT_LOW:  WEIGHT_LOW
});

module.exports = ScoreWeight;