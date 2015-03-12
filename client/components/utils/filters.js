'use strict';

angular
.module('auditpagesApp')
.filter('sify', function() {
  return function(v, n) {
    return v + (parseInt(n) === 1 ? '' : 's');
  };
})
.filter('percentage', function ($filter) {
  return function(input, precision, mul100) {
    precision = precision || 0;
    var testInput = parseFloat(input);

    if(mul100 && testInput !== NaN) {
      input = testInput * 100;
    }

    var numberFilter = $filter('number');
    return '%' + numberFilter(input, precision);
  };
})
.filter('durationMs', function(){
  return function(v) {
    if(v === undefined||
       v===false||
       v===null) return '---';

    v = parseFloat(v);

    var
    msHr = 3600 * 1000,
    units = {
      'hr'    : null,
      'min'   : null,
      'sec'   : null,
      'ms'    : null
    };

    units.hr  = Math.floor(((v / (1000*60*60)) % 24));
    units.min = Math.floor(((v / (1000*60)) % 60));
    units.sec = Math.floor((v / 1000) % 60);
    units.ms  = Math.floor(v % 1000);

    var
    unitMax  = 2,
    unitCount = 0,
    unitKeys = Object.keys(units);

    return unitKeys.reduce(function (p, c) {
      if(unitCount >= unitMax) return p;

      var append = '';

      if(units[c] >= 1 || p !== '') { // show?
        append = ' ' + units[c] + ' ' + c
        unitCount++;
      }

        return p + append;
      }, '').trim();
  }
});