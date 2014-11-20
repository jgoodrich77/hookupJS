'use strict';

var
util = require('util'),
_ = require('lodash'),
ScoreWeight = require('./score-weight');

function Score(weights, scoreBase) {
  scoreBase = scoreBase || 10;

  if(!weights) {
    weights = [];
  }
  else if(!util.isArray(weights)) {
    weights = [weights];
  }

  _.extend(this, {
    maxWeight: function() {
      if(!weights.length) {
        return 0;
      }
      return weights.reduce(function (p, c) {
        if(! c instanceof ScoreWeight ) {
          return p;
        }

        return Math.max(p, parseInt(c.getWeight()));
      }, 0);
    },
    calculate: function() {
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
    }
  });
}

module.exports = Score;