/**
*
* Universal number scaling class.
*
**/
function Scale(vlow, vhigh, low, high, algo, precision) {

  var
  algorithm = Scale.Algorithms[algo || 'linear'];

  if(!algorithm) throw 'Invalid algorithm was provided';

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
    if(!p) {
      return Math.round(v)
    }
    else {
      var f = Math.pow(10, p);
      return Math.round(v * f) / f;
    }
  }

  var
  nL  = parseFloat(vlow), nH  = parseFloat(vhigh),
  nlL = parseFloat(low),  nlH = parseFloat(high);

  if(isNaN(nL))  throw new Error('Invalid low value');
  if(isNaN(nH))  throw new Error('Invalid high value');
  if(isNaN(nlL)) throw new Error('Invalid scaled low value');
  if(isNaN(nlH)) throw new Error('Invalid scaled high value');

  var
  rL  = normalize(nL,  nL,  nH),  rH  = normalize(nH,  nL,  nH),
  rlL = normalize(nlL, nlL, nlH), rlH = normalize(nlH, nlL, nlH);

  this.calculate = function (v) {
    return round((rlL + algorithm(normalize(v, rL, rH) - rL, 0, (rlH - rlL), rH - rL)), precision);
  };
}

// contributed from:
// http://gizma.com/easing/
//
// See implementation example here:
// http://codepen.io/kryo2k/pen/NPxVZN
//
// t = current time or frames
// b = start value
// c = change in value
// d = total time or frames
//
Scale.Algorithms = {
  linear: function (t, b, c, d) {
    return c*t/d + b;
  },

  // quadratic
  quadIn: function (t, b, c, d) {
    t /= d;
    return c*t*t + b;
  },
  quadOut: function (t, b, c, d) {
    t /= d;
    return -c * t*(t-2) + b;
  },
  quadInOut: function (t, b, c, d) {
    t /= d/2;
    if (t < 1) return c/2*t*t + b;
    t--;
    return -c/2 * (t*(t-2) - 1) + b;
  },

  // cubic
  cubicIn: function (t, b, c, d) {
    t /= d;
    return c*t*t*t + b;
  },
  cubicOut: function (t, b, c, d) {
    t /= d;
    t--;
    return c*(t*t*t + 1) + b;
  },
  cubicInOut: function (t, b, c, d) {
    t /= d/2;
    if (t < 1) return c/2*t*t*t + b;
    t -= 2;
    return c/2*(t*t*t + 2) + b;
  },

  // quartic
  quartIn: function (t, b, c, d) {
    t /= d;
    return c*t*t*t*t + b;
  },
  quartOut: function (t, b, c, d) {
    t /= d;
    t--;
    return -c * (t*t*t*t - 1) + b;
  },
  quartInOut: function (t, b, c, d) {
    t /= d/2;
    if (t < 1) return c/2*t*t*t*t + b;
    t -= 2;
    return -c/2 * (t*t*t*t - 2) + b;
  },

  // quintic
  quintIn: function (t, b, c, d) {
    t /= d;
    return c*t*t*t*t*t + b;
  },
  quintOut: function (t, b, c, d) {
    t /= d;
    t--;
    return c*(t*t*t*t*t + 1) + b;
  },
  quintInOut: function (t, b, c, d) {
    t /= d/2;
    if (t < 1) return c/2*t*t*t*t*t + b;
    t -= 2;
    return c/2*(t*t*t*t*t + 2) + b;
  },

  // sinusoidal
  sineIn: function (t, b, c, d) {
   return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
  },
  sineOut: function (t, b, c, d) {
    return c * Math.sin(t/d * (Math.PI/2)) + b;
  },
  sineInOut: function (t, b, c, d) {
    return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
  },

  // exponential
  expoIn: function (t, b, c, d) {
    return c * Math.pow( 2, 10 * (t/d - 1) ) + b;
  },
  expoOut: function (t, b, c, d) {
    return c * ( -Math.pow( 2, -10 * t/d ) + 1 ) + b;
  },
  expoInOut: function (t, b, c, d) {
    t /= d/2;
    if (t < 1) return c/2 * Math.pow( 2, 10 * (t - 1) ) + b;
    t--;
    return c/2 * ( -Math.pow( 2, -10 * t) + 2 ) + b;
  },

  // circular
  circIn: function (t, b, c, d) {
    t /= d;
    return -c * (Math.sqrt(1 - t*t) - 1) + b;
  },
  circOut: function (t, b, c, d) {
    t /= d;
    t--;
    return c * Math.sqrt(1 - t*t) + b;
  },
  circInOut: function (t, b, c, d) {
    t /= d/2;
    if (t < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
    t -= 2;
    return c/2 * (Math.sqrt(1 - t*t) + 1) + b;
  }
};

module.exports = Scale;