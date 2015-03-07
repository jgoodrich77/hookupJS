'use strict';

angular
.module('auditpagesApp')
.factory('DateShifter', function () {

  function DateShifter(minDate, maxDate, step, direction) {
    this.minDate          = minDate   || false;
    this.maxDate          = maxDate   || false;
    this.defaultStep      = step      || 0;
    this.defaultDirection = direction || 1;
  }

  Object.defineProperties(DateShifter.prototype, {
    minDate: {
      get: function () {
        return this._minDate;
      },
      set: function (v) {
        if(v === false) {
          this._minDate = false;
          return;
        }

        this._minDate = DateShifter.normalizeDate(v);
      }
    },
    maxDate: {
      get: function () {
        return this._maxDate;
      },
      set: function (v) {
        if(v === false) {
          this._maxDate = false;
          return;
        }

        this._maxDate = DateShifter.normalizeDate(v);
      }
    }
  });

  DateShifter.normalizeDateMS = function(date, asUTC) { // Date milliseconds in local TZ.
    if(!date) return false;
    var
    ms = angular.isNumber(date) ? date
       : (date instanceof Date
          ? date.getTime()
          : Date.parse(date));

    if(ms === false || isNaN(ms)) return false;
    return ms + (!!asUTC ? (new Date).getTimeZoneOffset() * 60000 : 0);
  };

  DateShifter.normalizeDate = function(date, asUTC) {
    var ms = DateShifter.normalizeDateMS(date, asUTC);
    if(ms === false) return false;
    return new Date(ms);
  };

  DateShifter.shiftedDate = function(date, offset) {
    if(!date || isNaN(offset)) return date;
    var dateMS = DateShifter.normalizeDateMS(date, false);
    if(isNaN(dateMS)) return date;
    return new Date(dateMS + offset);
  };

  DateShifter.calculateOffset = function(step, direction) {
    return (step * direction);// + direction;
  };

  DateShifter.prototype.canShift = function (date, direction, step) {
    step      = step      || this.defaultStep;
    direction = direction || this.defaultDirection;
    if(!date || !step || !direction) return false;

    var
    sDate = DateShifter.shiftedDate(date, DateShifter.calculateOffset(step, direction));

    return (direction > 0)
      ? (!this.maxDate || sDate <= this.maxDate)
      : (!this.minDate || sDate >= this.minDate);
  };

  DateShifter.prototype.shift = function (date, direction, step) {
    if(!this.canShift(date, direction, step)) return date;

    step      = step      || this.defaultStep;
    direction = direction || this.defaultDirection;

    return DateShifter.shiftedDate(date, DateShifter.calculateOffset(step, direction));
  };

  return DateShifter;
});