'use strict';

var
util = require('util'),
Weight = require('./weight');

module.exports = function Score(weights) {
  if(!weights) {
    weights = 0;
  }

  if(!util.isArray(weights)) {
    weights = [weights];
  }

  this.compute = function() {
    if(!weights.length) return 0;

    var
    T    = 0,
    S = weights.reduce(function (p, w) {
      if(w instanceof Weight) {
        var i = w.getImportance();
        T += i;
        p += w.compute() * i;
      }

      return p;
    }, 0);

    return S / T;
  };
};