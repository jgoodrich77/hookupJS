'use strict';

angular
.module('auditpagesApp')
.factory('Time', function ($padLeft, $clamp) {
  var
  clampInt = $clamp.clampInt;

  function Time (hour, minute, second, msec) {

    this // normalize inputs
      .setHours(hour)
      .setMinutes(minute)
      .setSeconds(second)
      .setMilliseconds(msec);
  }

  Time.prototype.getAmPm = function() {
    return (this.hour >= 12 ? 'PM' : 'AM');
  };

  Time.prototype.get12Hr = function(ampm) {
    return String(this.hour % 12 || 12) + (!!ampm ? this.getAmPm() : '');
  };

  Time.prototype.getHours = function () {
    return this.hour   || 0;
  };

  Time.prototype.getMinutes = function (padded) {
    return !!padded ? $padLeft(this.minute, 2) : (this.minute || 0);
  };

  Time.prototype.getSeconds = function () {
    return this.second || 0;
  };

  Time.prototype.getMilliseconds = function () {
    return this.msec   || 0;
  };

  Time.prototype.setHours = function (v) {
    this.hour = clampInt(v, 0, 23);
    return this;
  };

  Time.prototype.setMinutes = function (v) {
    this.minute = clampInt(v, 0, 59);
    return this;
  };

  Time.prototype.setSeconds = function (v) {
    this.second = clampInt(v, 0, 59);
    return this;
  };

  Time.prototype.setMilliseconds = function (v) {
    this.msec = clampInt(v, 0);
    return this;
  };

  // apply to a date (or now)
  Time.prototype.toDate = function(now) {
    var N = new Date(now);

    N.setHours(this.getHours());
    N.setMinutes(this.getMinutes());
    N.setSeconds(this.getSeconds());
    N.setMilliseconds(this.getMilliseconds());

    return N;
  };

  Time.prototype.toString = function() {
    return [
      $padLeft(this.getHours(), 2),
      $padLeft(this.getMinutes(), 2),
      $padLeft(this.getSeconds(), 2)
    ].join(':') + '.' + $padLeft(this.getMilliseconds(), 3);
  };

  Time.prototype.msOffset = function () {
    var offset = 0;
    offset += this.getHours() * 3600000;
    offset += this.getMinutes() * 60000;
    offset += this.getSeconds() * 1000;
    offset += this.getMilliseconds();
    return offset;
  };

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

  Time.fromOffset = function (offset) {
    offset = isNaN(offset) ? 0 : Math.min(86399999, Math.max(0, offset));
    var N = new Time();
    N.setHours(Math.floor(((offset / (1000*60*60)))));
    N.setMinutes(Math.floor(((offset / (1000*60)) % 60)));
    N.setSeconds(Math.floor((offset / 1000) % 60));
    N.setMilliseconds(Math.floor(offset % 1000));
    return N;
  };

  Time.fromDate = function(date) {
    if(!date || !date instanceof Date) return false;
    return new Time(
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
      date.getMilliseconds()
    );
  };

  Time.parse = function (str) {

    if(str instanceof Time) {
      return str;
    }

    if(str instanceof Date) {
      return Time.fromDate(str);
    }

    if(angular.isNumber(str)) { // assume date (extract time component only)
      return Time.fromDate(new Date(str));
    }
    else if(angular.isString(str)) {
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

  return Time;
});