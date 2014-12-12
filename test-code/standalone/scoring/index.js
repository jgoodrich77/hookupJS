'use strict';

var
Score = require('./lib/score'),
Weight = require('./lib/weight');

var
////////////////////////////////////////////////////
testImportance = [ 0.99, 0.75, 0.50, 0.25, 0.01 ],//
////////////////////////////////////////////////////
testHighest    = [ 0.99, 0.75, 0.50, 0.25, 0.01 ],
testHigh       = [ 0.80, 0.75, 0.50, 0.25, 0.01 ],
testMedium     = [ 0.60, 0.75, 0.50, 0.25, 0.01 ],
testAverage    = [ 0.40, 0.75, 0.50, 0.25, 0.01 ],
testSmall      = [ 0.20, 0.75, 0.50, 0.25, 0.01 ],
testSmallest   = [ 0.05, 0.75, 0.50, 0.25, 0.01 ],
testNames      = [
  '  Highest ',
  '   High   ',
  '  Medium  ',
  '  Average ',
  '   Small  ',
  ' Smallest '
];

[ testHighest,
  testHigh,
  testMedium,
  testAverage,
  testSmall,
  testSmallest ].forEach(function (v, i) {
  console.log('Test (%s): %s', testNames[i], new Score(v.map(function (w, i) {
    return new Weight(w, 0, 1, testImportance[i]);
  })).compute().toFixed(5));
});