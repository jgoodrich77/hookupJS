'use strict';

angular
.module('auditpagesApp')
.service('$clamp', function() {

  function isNumber(v) {
    return v !== null
      && !angular.isUndefined(v)
      && angular.isNumber(v);
  }

  function asNumber(v, defaultVal) {
    defaultVal = isNumber(defaultVal)
      ? defaultVal
      : 0;

    if(v === null || angular.isUndefined(v)) return defaultVal;
    if(isNumber(v)) return v;

    var n = parseFloat(v);
    if(isNaN(n)) return defaultVal;
    return n;
  }

  function clampFloat(n, min, max, precision) {
    n = asNumber(n);

    if(isNumber(min)) n = Math.max(n, min);
    if(isNumber(max)) n = Math.min(n, max);
    if(isNumber(precision)) {
      var f = Math.pow(10, precision);
      n = Math.round(n * f) / f;
    }

    return n;
  }

  function clampInt(n, min, max) {
    return clampFloat(n, min, max, 0);
  }

  return {
    clampInt: clampInt,
    clampFloat: clampFloat,
    asNumber: asNumber,
    isNumber: isNumber
  };
});