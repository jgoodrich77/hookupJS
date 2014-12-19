'use strict';

var
util = require('util'),
Weight = require('./lib/weight');

module.exports = function Score(weights, label) {
  if(!weights) {
    weights = 0;
  }

  if(!util.isArray(weights)) {
    weights = [weights];
  }

  this.getLabel = function() {
    return label;
  };

  this.compute = function() {
    if(!weights.length) return 0;

    var
    T    = 0,
    S = weights.reduce(function (p, w) {

      var
      adjustment = 0,
      weight     = 0;

      if(w instanceof Weight) {
        weight = w.getImportance();
        adjustment = w.compute();
      }
      else if(w instanceof Score) {
        weight = 1;
        adjustment = w.compute();
      }

      if(weight === 0 || isNaN(adjustment)) return p;

      T += weight;
      p += (adjustment * weight);

      return p;
    }, 0);

    if(T === 0) return 0;

    return S / T;
  };

  this.explain = function() {
    var result = [];
    if(!weights.length) return result;

    var
    T = 0,
    S = weights.reduce(function (p, w) {

      var
      adjustment = 0,
      weight     = 0,
      expln      = {};

      if(w instanceof Weight) {
        weight = w.getImportance();
        adjustment = w.compute();
        expln.label = w.getLabel();
      }
      else if(w instanceof Score) {
        weight = 1;
        adjustment = w.compute();
        expln.expanded = w.explain(); // explain how this scoring happened.
        expln.label = w.getLabel();
      }

      expln.score = adjustment;

      if(weight === 0 || isNaN(adjustment)) return p;

      T += weight;
      p += (adjustment * weight);

      result.push(expln);

      return p;
    }, 0);

    if(T === 0) return [];

    result.push({
      total: S / T
    });

    return result;
  };
};

// attach to constructor
module.exports.Weight = Weight;