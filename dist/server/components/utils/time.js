'use strict';

var
_ = require('lodash'),
padLeft = require('./pad-left'),
isNumber = _.isNumber.bind(_),
isString = _.isString.bind(_);

/**
 * Time parsing library.
 * @author Hans Doller <kryo2k@gmail.com>
 */

function Time (hour, minute, second, msec) {

  function normalize(n, min, max) {
    n = parseInt(n);

    if(isNaN(n)) {
      return min || 0;
    }

    if(min === undefined && max == undefined) {
      return n;
    }
    if(min !== undefined) {
      n = Math.max(min, n);
    }
    if(max !== undefined) {
      n = Math.min(max, n);
    }
    return n;
  }

  this.get12Hr = function() {
    return String(hour % 12 || 12) + (hour >= 12 ? 'PM' : 'AM');
  };
  this.getHours = function () {
    return hour   || 0;
  };
  this.getMinutes = function () {
    return minute || 0;
  };
  this.getSeconds = function () {
    return second || 0;
  };
  this.getMilliseconds = function () {
    return msec   || 0;
  };

  this.setHours = function (v) {
    hour = normalize(v, 0, 23);
    return this;
  };
  this.setMinutes = function (v) {
    minute = normalize(v, 0, 59);
    return this;
  };
  this.setSeconds = function (v) {
    second = normalize(v, 0, 59);
    return this;
  };
  this.setMilliseconds = function (v) {
    msec = normalize(v, 0);
    return this;
  };

  // apply to a date (or now)
  this.toDate = function(now) {
    var N = new Date(now);

    N.setHours(this.getHours());
    N.setMinutes(this.getMinutes());
    N.setSeconds(this.getSeconds());
    N.setMilliseconds(this.getMilliseconds());

    return N;
  };
  this.toString = function() {
    return [
      padLeft(this.getHours(), 2),
      padLeft(this.getMinutes(), 2),
      padLeft(this.getSeconds(), 2)
    ].join(':') + '.' + padLeft(this.getMilliseconds(), 3);
  };

  this // normalize inputs
    .setHours(hour)
    .setMinutes(minute)
    .setSeconds(second)
    .setMilliseconds(msec);
}

Time.isSameDay = function (date, now) {
  now = now || new Date;
  var d = new Date(date);
  return (d.getFullYear() === now.getFullYear()) &&
         (d.getMonth()    === now.getMonth()) &&
         (d.getDate()     === now.getDate());
};

Time.isFuture = function(date, now) {
  now = now || new Date;
  return (new Date(date)).getTime() > now.getTime();
};

Time.isPast = function(date, now) {
  now = now || new Date;
  return (new Date(date)).getTime() < now.getTime();
};

Time.parse = function (str) {

  if(str instanceof Time) {
    return str;
  }

  if(isNumber(str)) { // assume date (extract time component only)
    var t = new Date(str);
    return new Time(t.getHours(), t.getMinutes(), t.getSeconds(), t.getMilliseconds());
  }
  else if(isString(str)) {
    var
    rxp = /^([0-9]+)\:?([0-9]*)\:?([0-9]*)\.?([0-9]*)(a|p|am|pm|)?$/i;

    if(!rxp.test(str)) {
      return false;
    }

    var
    match = str.match(rxp),
    h     = parseInt(match[1]),
    m     = parseInt(match[2]),
    s     = parseInt(match[3]),
    ms    = parseInt(match[4]),
    ampm  = (match[5]||'').toLowerCase();

    if(isNaN(h) || h > 23 || m > 59 || s > 59) {
      return false;
    }
    if(h > 12) {
      ampm = false; // ignore ampm check
    }
    if(ampm === 'p'||ampm === 'pm') { // normalize to 24hr:
      h += 12;
    }
    return new Time(h, m, s, ms);
  }

  return false;
};

module.exports = Time;