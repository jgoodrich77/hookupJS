'use strict';

module.exports = function Weight(value, minimum, maximum, importance, label) {
  importance = (importance === undefined) ? 1 : parseFloat(importance);

  minimum = parseFloat(minimum || 0);
  maximum = parseFloat(maximum || 1);

  var
  nMin = Math.min(minimum, maximum),
  nMax = Math.max(minimum, maximum);

  value = parseFloat(value || nMin);

  if(isNaN(importance) || importance > 1) {
    importance = 1;
  }
  if(isNaN(value)) {
    value = nMin;
  }

  value = Math.min(nMax, Math.max(nMin, value));

  this.getValue = function() {
    return value;
  };

  this.getMinValue = function() {
    return nMin;
  };

  this.getMaxValue = function() {
    return nMax;
  };

  this.getLabel = function() {
    return label;
  };

  this.getImportance = function() {
    return importance;
  };

  this.compute = function () {
    return (value - nMin) / (nMax - nMin);
  };
};