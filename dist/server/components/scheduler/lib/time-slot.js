'use strict';

var
_ = require('lodash'),
util = require('util');

function TimeSlot(spec) {

  function normalizeDate(v) {
    if(_.isObject(v) && v instanceof Date) return v;
    if(_.isNumber(v)) return new Date(Math.round(v));
    if(_.isString(v)) {
      var ms = Date.parse(v);
      if(!isNaN(ms)) return new Date(ms);
    }

    return false;
  }

  function normalizeDateRange(v1, v2) {
    var
    d1 = normalizeDate(v1),
    d2 = normalizeDate(v2);

    if(!d1 || !d2) return false;

    var
    ms1 = d1.getTime(),
    ms2 = d2.getTime();

    return {
      start: new Date(Math.min(ms1, ms2)),
      end:   new Date(Math.max(ms2, ms1))
    };
  }

  var dateRange, date;

  if(_.isArray(spec)) { // validate as an array of dates
    var len =  spec.length;

    if(len === 1) {
      date = normalizeDate(spec[0]);
    }
    else if(len == 2) {
      dateRange = normalizeDateRange(spec[0], spec[1]);
    }
  }
  else if(arguments.length === 2) { // multple arguments
    dateRange = normalizeDateRange(arguments[0], arguments[1]);
  }
  else { // validate as a single date
    date = normalizeDate(spec);
  }

  this.isDateRange = function() {
    return !!dateRange;
  };
  this.isDate = function() {
    return !!date;
  };
  this.isValid = function() {
    return this.isDate() || this.isDateRange();
  };

  this.isFuture = function(now) {
    now = normalizeDate(now||new Date);

    if(this.isDateRange()) {
      return now.getTime() < dateRange.start.getTime();
    }
    else if(this.isDate()) {
      return now.getTime() < date.getTime();
    }

    return false;
  };
  this.isPresent = function(now) {
    now = normalizeDate(now||new Date);

    var nowMs = now.getTime();

    if(this.isDateRange()) {
      return nowMs >= dateRange.start.getTime()
        && nowMs <= dateRange.end.getTime();
    }
    else if(this.isDate()) {
      return nowMs === date.getTime();
    }

    return false;
  };
  this.isPast = function(now) {
    now = normalizeDate(now||new Date);

    if(this.isDateRange()) {
      return now.getTime() > dateRange.end.getTime();
    }
    else if(this.isDate()) {
      return now.getTime() > date.getTime();
    }

    return false;
  };
  this.isOverlapping = function(now) {
    now = normalizeDate(now||new Date);
    return (!this.isFuture(now) && (this.isPresent(now) || this.isPast(now)));
  };
}

TimeSlot.validate = function(spec) {
  return (new TimeSlot(spec)).isValid();
};

module.exports = TimeSlot;