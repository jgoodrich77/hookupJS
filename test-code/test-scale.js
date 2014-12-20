'use strict';

var
Scale = require('../server/components/scale');

var
prec    = 5,
samples = 5,
vLow  = 1,
vHigh = 10,

oLow  = 0,
oHigh = 1,

testAlgos = Object.keys(Scale.Algorithms)
  .map(function (algo) {
    return function () {
      var
      scale = new Scale(vLow, vHigh, oLow, oHigh, algo, prec),
      sampleSize = (vHigh - vLow) / (samples - 1);

      console.log('Algorithm: %s', algo);
      for(var i = vLow; i <= vHigh; i += sampleSize) {
        console.log('(%s): %d', i.toFixed(3), scale.calculate(i));
      }
    };
  });

testAlgos.forEach(function (fn) {
  fn();
});