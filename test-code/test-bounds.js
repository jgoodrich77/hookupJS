'use strict';

function normalize(v, min, max) {
  var
  tV = parseFloat(v);

  min = (min === undefined) ? -Infinity : parseFloat(min);
  max = (max === undefined) ?  Infinity : parseFloat(max);

  if(isNaN(tV) || isNaN(min) || isNaN(max)) {
    return false;
  }

  return Math.max(Math.min(min, max), Math.min(Math.max(max, min), tV))
}

function round(v, p) {
  var nV;

  if(!p) {
    return Math.round(v)
  }
  else {
    var f = Math.pow(10, p);
    return Math.round(v * f) / f;
  }
}

[
  { fn: function() { return normalize(-10); }, expect: -10  },
  { fn: function() { return normalize( 10); }, expect:  10  },
  { fn: function() { return normalize(-10, 0, 10); }, expect: 0  },
  { fn: function() { return normalize( 20, 0, 10); }, expect: 10 },
  { fn: function() { return normalize( 1.333, 0, 10); }, expect: 1.333 },
  { fn: function() { return normalize( null, 0, 10); }, expect: false },
  { fn: function() { return normalize( {}, 0, 10); }, expect: false },

  { fn: function() { return round( 1.5      ); }, expect: 2     },
  { fn: function() { return round( 1.5,    0); }, expect: 2     },
  { fn: function() { return round( 1.49,   1); }, expect: 1.5   },
  { fn: function() { return round( 1.489,  2); }, expect: 1.49  },
  { fn: function() { return round( 1.4989, 3); }, expect: 1.499 },
  { fn: function() { return round( 1.4999, 3); }, expect: 1.5   }
].forEach(function (test, i) {
  var
  expect = test.expect,
  result = (test.fn || function(){}).call(test),
  passes = (result === expect);

  console.log('[%d] [%s] (%s %s %s)',
    i,
    (passes ? 'PASS' : 'FAIL'),
    JSON.stringify(result),
    (passes ? '===' : '!=='),
    JSON.stringify(expect)
  );

});