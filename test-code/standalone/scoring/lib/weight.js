'use strict';

module.exports = function Weight(value, minimum, maximum, importance) {

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

  this.getImportance = function() {
    return importance;
  };

  this.compute = function () {
    return value / nMax;
  };
};