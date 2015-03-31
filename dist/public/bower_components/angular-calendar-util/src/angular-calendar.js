(function (window, angular) {'use strict';

  /**
  ** Angular-Calendar
  ** General-purpose time-date functions for Angular 1.3.x.
  **
  ** @author Hans Doller <hans@ticonerd.com>
  **/

  var VERSION = 0.1;

  angular
  .module('angular-calendar', [])

  .constant('CalendarVersion', VERSION)

  /**
   * Calendar class
   *
   * Supports setting the beginning of week day, year and initial week.
   * Has an internal pointer for current year and week, when changed it
   * updates calculations.
   *
   * Provides many static date utility functions as well.
   *
   */

  .factory('Calendar', ['DateRange', '$numberUtil', function (DateRange, $numberUtil) {
      function Calendar(boW, year, week) {
        this._boW = Calendar.DEFAULT_BOW;
        this.beginningOfWeek = boW;

        if (year && week) {
          this.year = year;
          this.week = week;
        } else {
          this.toToday();
        }
      }

      Object.defineProperties(Calendar.prototype, {
        beginningOfWeek: {
          get: function () { return this._boW; },
          set: function (v) {
            if (!Calendar.validBeginningOfWeek(v)) { return; }
            this._boW = v;
            this.reloadWeekDates();
          }
        },
        week: {
          get: function () { return this._week; },
          set: function (v) {
            var xclamped =  $numberUtil.clamp($numberUtil.normalize(v, 1), 0, 54);

            if (xclamped > 53) {
              this.year++;
              xclamped = 1;
            } else if (xclamped < 1) {
              this.year--;
              xclamped = 53;
            }

            this._week = xclamped;
            this.reloadWeekDates();
          }
        },
        year: {
          get: function () { return this._year; },
          set: function (v) {
            this._year = $numberUtil.clamp($numberUtil.normalize(v, this.year), 0);
            this.reloadWeekDates();
          }
        },
        dateRange: {
          get: function () {
            return this.getWeekDates(this.year, this.week);
          }
        },
        weekSpansMonths: {
          get: function () {
            var range = this.dateRange;
            return range.from.getMonth() !== range.to.getMonth();
          }
        },
        weekDates: {
          get: function () {
            if (!this._lWeekDates) { this.reloadWeekDates(); }
            return this._lWeekDates;
          }
        },
        isThisWeek: {
          get: function () {
            return this.week === this.nowWeek && this.year === this.nowYear;
          }
        },
        now: {
          get: function () {
            return new Date();
          }
        },
        nowYear: {
          get: function () {
            return this.now.getFullYear();
          }
        },
        nowWeek: {
          get: function () {
            return Calendar.dateWeek(this.now, this.beginningOfWeek);
          }
        }
      });

      Calendar.DAY_PER_WEEK = 7;
      Calendar.MS_PER_DAY = 8.64e7;
      Calendar.MS_PER_WEEK = Calendar.MS_PER_DAY * Calendar.DAY_PER_WEEK;
      Calendar.DEFAULT_BOW = 0; // sunday

      Calendar.validBeginningOfWeek = function (v) {
        return !(isNaN(v) || v < 0 || v > 6);
      };

      Calendar.validMonth = function (v) {
        return !(isNaN(v) || v < 0 || v > 11);
      };

      Calendar.now = function (now) {
        if (angular.isNumber(now) || angular.isString(now)) { return new Date(now); }
        return (now instanceof Date) ? new Date(now) : new Date();
      };

      Calendar.nowFloor = function (now) {
        now = Calendar.now(now);
        now.setHours(0, 0, 0, 0);
        return now;
      };

      Calendar.nowCeil = function (now) {
        now = Calendar.now(now);
        now.setHours(23, 59, 59, 999);
        return now;
      };

      Calendar.isLeapYear = function (year) {
        return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
      };

      Calendar.isSameDay = function (date, now) {
        date = Calendar.now(date);
        now  = Calendar.now(now);

        if (!date || !now) { return false; }

        return date.getFullYear() === now.getFullYear() &&
               date.getMonth()    === now.getMonth() &&
               date.getDate()     === now.getDate();
      };

      Calendar.isFuture = function (date, now) {
        now = Calendar.now(now);
        date = Calendar.now(date);

        if (!date || !now) { return false; }

        return date > now;
      };

      Calendar.isPast = function (date, now) {
        now = Calendar.now(now);
        date = Calendar.now(date);

        if (!date || !now) { return false; }

        return date < now;
      };

      Calendar.dateOffset = function (offset, now, unit) {
        unit = (unit || 'ms').toLowerCase();
        now = Calendar.now(now);
        offset = isNaN(offset) ? 0 : offset;

        var ntime = now.getTime(),
          applyOffset = false;

        switch (unit) {
        case 'millisecond':
        case 'milliseconds':
        case 'milli':
        case 'ms':
          offset *= 1;
          applyOffset = true;
          break;

        case 'second':
        case 'seconds':
        case 'secs':
        case 'sec':
          offset *= 1000;
          applyOffset = true;
          break;

        case 'minute':
        case 'minutes':
        case 'mins':
        case 'min':
          offset *= 60000;
          applyOffset = true;
          break;

        case 'hours':
        case 'hour':
        case 'hr':
          offset *= 3600000;
          applyOffset = true;
          break;

        case 'days':
        case 'day':
          offset *= Calendar.MS_PER_DAY;
          applyOffset = true;
          break;

        case 'weeks':
        case 'week':
          offset *= Calendar.MS_PER_WEEK;
          applyOffset = true;
          break;
        }

        var offsetDate = new Date(ntime + (applyOffset ? Math.round(offset) : 0));

        if (!applyOffset) {

          var origYear       = offsetDate.getFullYear(),
            origMonth        = offsetDate.getMonth(),
            origDate         = offsetDate.getDate(),
            origHrs          = offsetDate.getHours(),
            origMin          = offsetDate.getMinutes(),
            origSec          = offsetDate.getSeconds(),
            origMS           = offsetDate.getMilliseconds(),
            isLeapYear       = Calendar.isLeapYear(origYear),
            isLastDayOfMonth = Calendar.isLastDateOfMonth(origYear, origMonth, origDate);

          switch (unit) {
          case 'months':
          case 'month':

            var expectMonth = Calendar.clampMonth(origMonth + offset),
              expectYear  = origYear + Math.floor((origMonth + offset) / 12),
              expectDate  = origDate,
              nMonthLDay  = Calendar.getLastDayOfMonth(expectYear, expectMonth);

            expectDate = Math.min(isLastDayOfMonth ? Infinity : origDate, nMonthLDay);
            offsetDate.setFullYear(expectYear, expectMonth, expectDate);

            break;
          case 'years':
          case 'year':
            var offsetYear;

            offsetDate.setFullYear(origYear + Math.round(offset));
            offsetYear = offsetDate.getFullYear();

            if ((isLeapYear || Calendar.isLeapYear(offsetYear)) && isLastDayOfMonth) {
              offsetDate.setMonth(origMonth, Calendar.getLastDayOfMonth(offsetYear, origMonth));
            }

            break;
          }

          // restore any DST changes that might have occurred
          offsetDate.setHours(origHrs, origMin, origSec, origMS);
        }

        return offsetDate;
      };

      Calendar.utcOffset = function (date, offset) {
        offset = (isNaN(offset) ? Calendar.now(date).getTimezoneOffset() : offset);
        return Calendar.dateOffset(-offset, date, 'minutes');
      };

      Calendar.bowOffsetDays = function (date, bow) {
        date = Calendar.now(date);
        bow  = Calendar.validBeginningOfWeek(bow) ? bow : Calendar.DEFAULT_BOW;
        return bow - date.getDay();
      };

      Calendar.bowOffset = function (date, bow) {
        return (Calendar.bowOffsetDays(date, bow) * Calendar.MS_PER_DAY);
      };

      Calendar.bowNearest = function (date, bow) {
        return Calendar.dateOffset(Calendar.bowOffset(date, bow));
      };

      Calendar.bowEqBefore = function (date, bow) {
        var offset = Calendar.bowOffset(date, bow);
        if (offset > 0) { offset -= Calendar.MS_PER_WEEK; }
        return Calendar.dateOffset(offset, date);
      };

      Calendar.bowBefore = function (date, bow) {
        var offset = Calendar.bowOffset(date, bow);
        if (offset >= 0) { offset -= Calendar.MS_PER_WEEK; }
        return Calendar.dateOffset(offset, date);
      };

      Calendar.bowEqAfter = function (date, bow) {
        var offset = Calendar.bowOffset(date, bow);
        if (offset < 0) { offset += Calendar.MS_PER_WEEK; }
        return Calendar.dateOffset(offset, date);
      };

      Calendar.bowAfter = function (date, bow) {
        var offset = Calendar.bowOffset(date, bow);
        if (offset <= 0) { offset += Calendar.MS_PER_WEEK; }
        return Calendar.dateOffset(offset, date);
      };

      Calendar.clampMonth = function (month) {
        return $numberUtil.clamp((12 + (month % 12)) % 12, 0, 11, 0);
      };

      Calendar.getBeginningOfYear = function (year) {
        return Calendar.getFirstDateOfMonth(year, 0);
      };

      Calendar.getFirstWeekDateOfYear = function (year, bow) {
        return Calendar.bowEqBefore(Calendar.getBeginningOfYear(year), bow);
      };

      Calendar.getLastWeekDateOfYear = function (year, bow) {
        return Calendar.weekDates(year, 53, bow).to; // i don't think that's right.
      };

      Calendar.getFirstDateOfMonth = function (year, month) {
        if (!Calendar.validMonth(month)) { month = (new Date()).getMonth(); }
        year = year || (new Date()).getFullYear();
        return new Date(year, month, 1, 0, 0, 0);
      };

      Calendar.getLastDateOfMonth = function (year, month) {
        if (!Calendar.validMonth(month)) { month = (new Date()).getMonth(); }
        year = year || (new Date()).getFullYear();
        var nmonth = month + 1;
        if (nmonth === 12) { year++; nmonth = 0; }
        return Calendar.dateOffset(-1, Calendar.getFirstDateOfMonth(year, nmonth));
      };

      Calendar.isLastDateOfMonth = function (year, month, date) {
        return (date === Calendar.getLastDayOfMonth(year, month));
      };

      Calendar.getFirstDayOfMonth = function (year, month) {
        var ndate = Calendar.getFirstDateOfMonth(year, month);
        if (!ndate) { return false; }
        return ndate.getDate();
      };

      Calendar.getLastDayOfMonth = function (year, month) {
        var ndate = Calendar.getLastDateOfMonth(year, month);
        if (!ndate) { return false; }
        return ndate.getDate();
      };

      Calendar.dateUnDST = function (date, relTzOffset) {
        date = Calendar.now(date);
        relTzOffset = isNaN(relTzOffset) ? Calendar.getFirstWeekDateOfYear(date.getFullYear()).getTimezoneOffset() : relTzOffset;

        var dateTzOffset = date.getTimezoneOffset();

        if (dateTzOffset !== relTzOffset) {
          date.setTime(date.getTime() + ((dateTzOffset - relTzOffset) * 60000));
        }

        return date;
      };

      Calendar.dateWeek = function (date, bow, withYear) {
        date = Calendar.now(date);

        var firstWeekDate = Calendar.getFirstWeekDateOfYear(date.getFullYear(), bow);

        // set time to match date's to prevent un-wanted rounding problems.
        firstWeekDate.setHours(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());

        var dateOffset    = ((date - firstWeekDate) / Calendar.MS_PER_DAY) + 1,
          weekNumber    = Math.ceil(dateOffset / Calendar.DAY_PER_WEEK);

        if (withYear) {
          return [date.getFullYear(), weekNumber];
        }

        return weekNumber;
      };

      Calendar.weekDates = function (year, week, bow) {
        year = year || Calendar.now().getFullYear();
        week = week || Calendar.dateWeek(null, bow, false);

        var weekNumber;

        if (angular.isArray(week)) {
          weekNumber = week[1];
        } else {
          weekNumber = isNaN(week) ? 1 : week;
        }

        var weekOffset  = Calendar.MS_PER_WEEK * (weekNumber - 1),
          firstWeekDate = Calendar.getFirstWeekDateOfYear(year, bow),
          weekStart     = Calendar.dateUnDST(firstWeekDate.getTime() + weekOffset, firstWeekDate.getTimezoneOffset()),
          weekEnd       = Calendar.dateUnDST(weekStart.getTime() + (Calendar.MS_PER_WEEK - 1), weekStart.getTimezoneOffset());

        return new DateRange(weekStart, weekEnd);
      };

      Calendar.weekDateRange = function (year, week, bow) {
        var result = [],
          i,
          range = Calendar.weekDates(year, week, bow),
          endTime = range.to.getTime();

        for (i = range.from.getTime(); i <= endTime; i += Calendar.MS_PER_DAY) {
          result.push(new Date(i));
        }

        return result;
      };

      Calendar.prototype.isSameDay = Calendar.isSameDay;

      Calendar.prototype.dateOffset = Calendar.dateOffset;

      Calendar.prototype.weekDateRange = function (year, week) {
        return Calendar.weekDateRange(year || this.year, week || this.week, this.beginningOfWeek);
      };

      Calendar.prototype.reloadWeekDates = function () {
        this._lWeekDates = this.weekDateRange();
        return this._lWeekDates;
      };

      Calendar.prototype.getWeekNumber = function (date, withYear) {
        return Calendar.dateWeek(date, this.beginningOfWeek, withYear);
      };

      Calendar.prototype.getWeekDates = function (year, week) {
        return Calendar.weekDates(year || this.year, week || this.week, this.beginningOfWeek);
      };

      Calendar.prototype.toToday = function () {
        this._year = this.nowYear;
        this._week = this.nowWeek;
        this.reloadWeekDates();
      };

      Calendar.prototype.isToday = function (date) {
        var dateWeek = Calendar.dateWeek(date, this.bow, true);
        return this.year === dateWeek[0] && this.week === dateWeek[1] && this.isSameDay(date);
      };

      Calendar.prototype.clampedWeekDates = function (week) {

        week = isNaN(week) ? this.week : week;

        var xclamped = $numberUtil.clamp($numberUtil.normalize(week, 1), 0, 54),
          year = this.year;

        if (xclamped > 53) {
          year++;
          week = 1;
        } else if (xclamped < 1) {
          year--;
          week = 53;
        }

        return this.getWeekDates(year, week);
      };

      return Calendar;
    }])

  /**
   * $padLeft function
   *
   * Ability to pad a string on the left with N amount of string characters.
   */
  .service('$padLeft', function () {
    return function (nr, n, str) {
      return (new Array(n - String(nr).length + 1)).join(str || '0') + nr;
    };
  })

  /**
   * $numberUtil service class
   *
   * Verious number abilities used in classes and other functions.
   *
   * Be-careful with 'sequence', it can generate a lot of results, and saturate memory.
   * It is internally capped to 10,000 records maximum.
   */
  .service('$numberUtil', function () {

    function isNumber(v) {
      return v !== null && !angular.isUndefined(v) && angular.isNumber(v);
    }

    function asNumber(v, defaultVal) {
      defaultVal = isNumber(defaultVal) ? defaultVal : 0;

      if ((v === null || angular.isUndefined(v))) { return defaultVal; }
      if (isNumber(v)) { return v; }

      var n = parseFloat(v);
      if (isNaN(n)) { return defaultVal; }
      return n;
    }

    function round (v, precision) {
      precision = isNaN(precision) ? 0 : precision;
      var f = Math.pow(10, precision);
      v = Math.round(v * f) / f;
      return v;
    }

    function clamp (v, min, max, precision) {
      if (!isNumber(v))  { v = 0; }
      if (isNumber(min)) { v = Math.max(v, min); }
      if (isNumber(max)) { v = Math.min(v, max); }
      if (isNumber(precision)) { v = round(v, precision); }
      return v;
    }

    function random(min, max, precision) {
      min = asNumber(min, 0);
      max = asNumber(max, 1);
      return round(min + (Math.random() * (max - min)), precision);
    }

    var SEQ_CAP = 1e4;

    function seq(min, max, density, randomness, resolution, precision) {
      var
      n1 = asNumber(min, 0),
      n2 = asNumber(max, 10),
      step, delta, dstep,
      sequence = [];

      resolution = clamp(asNumber(resolution, 1), 1, null, 5);
      density    = clamp(asNumber(density, 1), 0, 1, 5);
      randomness = clamp(asNumber(randomness, 1), 0, 1, 5);

      min = Math.min(n1, n2);
      max = Math.max(n1, n2);
      delta = max - min;
      dstep = (delta / (delta * density)) * resolution;

      if (delta === 0 || !isFinite(dstep)) { return sequence; }

      var i=0, maxRecords = Math.ceil(delta / dstep), val;

      if (!isFinite(maxRecords)||maxRecords > SEQ_CAP) { // prevent crashes
        maxRecords = SEQ_CAP;
        dstep = (delta / maxRecords);
      }

      while(i < maxRecords) {
        step = 0;

        if (!isNaN(randomness) && randomness > 0) {
          step += random(-dstep*randomness, dstep*randomness, precision);
        }

        sequence.push(clamp(
          round(min + ((i * dstep) + step), precision),
          min, max, precision
        ));

        i++;
      }

      return sequence;
    }

    return {
      isNumber: isNumber,
      normalize: asNumber,
      random: random,
      round: round,
      sequence: seq,
      clamp: clamp
    };
  })

  /**
   * Time class
   *
   * Similar to JS Date, but only uses the hour, min, sec, milli. Allows overriding dates
   * with these specific time specs.
   */
  .factory('Time', ['$padLeft', '$numberUtil', 'Calendar', function ($padLeft, $numberUtil, Calendar) {

    function clampInt(n, min, max) {
      return $numberUtil.clamp(n, min, max, 0);
    }

    function Time (hour, minute, second, msec) {

      this // normalize inputs
        .setHours(hour)
        .setMinutes(minute)
        .setSeconds(second)
        .setMilliseconds(msec);
    }

    Object.defineProperties(Time.prototype, {
      offset: {
        get: function () { return this.getOffset(); },
        set: function (v) { return this.setOffset(v); }
      }
    });

    Time.prototype.getAmPm = function () {
      return (this.hour >= 12 ? 'PM' : 'AM');
    };

    Time.prototype.get12Hr = function (ampm) {
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

    Time.prototype.setOffset = function (v) {
      if (isNaN(v) || v >= 8.64e7) { return this; }
      this.copyFrom(Time.fromOffset(v));
      return this;
    };

    Time.prototype.getOffset = function () {
      var offset = 0;
      offset += this.getHours() * 3600000;
      offset += this.getMinutes() * 60000;
      offset += this.getSeconds() * 1000;
      offset += this.getMilliseconds();
      return offset;
    };

    Time.prototype.copyTo = function (v) {
      if (!v || !v instanceof Time) { return this; }

      v.setHours(this.getHours());
      v.setMinutes(this.getMinutes());
      v.setSeconds(this.getSeconds());
      v.setMilliseconds(this.getMilliseconds());

      return this;
    };

    Time.prototype.copyFrom = function (v) {
      if (!v || !v instanceof Time) { return this; }

      this.setHours(v.getHours());
      this.setMinutes(v.getMinutes());
      this.setSeconds(v.getSeconds());
      this.setMilliseconds(v.getMilliseconds());

      return this;
    };

    // apply to a date (or now)
    Time.prototype.toDate = function (now) {
      var N = new Date(now);

      N.setHours(this.getHours());
      N.setMinutes(this.getMinutes());
      N.setSeconds(this.getSeconds());
      N.setMilliseconds(this.getMilliseconds());

      return N;
    };

    Time.prototype.toString = function () {
      return [
        $padLeft(this.getHours(), 2),
        $padLeft(this.getMinutes(), 2),
        $padLeft(this.getSeconds(), 2)
      ].join(':') + '.' + $padLeft(this.getMilliseconds(), 3);
    };

    Time.prototype.equals = function (v) {
      return Time.equals(this, v);
    };

    Time.prototype.before = function (v, equals) {
      return Time.before(this, v, equals);
    };

    Time.prototype.beforeEq = function (v) {
      return this.before(v, true);
    };

    Time.prototype.after = function (v, equals) {
      return Time.after(this, v, equals);
    };

    Time.prototype.afterEq = function (v) {
      return this.after(v, true);
    };

    Time.prototype.between = function (a, b) {
      return Time.between(this, a, b);
    };

    // bw compatibility
    Time.prototype.msOffset = Time.prototype.getOffset;

    Time.isSameDay = Calendar.isSameDay.bind(Calendar);
    Time.isFuture = Calendar.isFuture.bind(Calendar);
    Time.isPast = Calendar.isPast.bind(Calendar);

    Time.fromOffset = function (offset) {
      offset = isNaN(offset) ? 0 : Math.min(86399999, Math.max(0, offset));
      var N = new Time();
      N.setHours(Math.floor(((offset / (1000*60*60)))));
      N.setMinutes(Math.floor(((offset / (1000*60)) % 60)));
      N.setSeconds(Math.floor((offset / 1000) % 60));
      N.setMilliseconds(Math.floor(offset % 1000));
      return N;
    };

    Time.fromDate = function (date) {
      if (!date || !date instanceof Date) { return false; }
      return new Time(
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
        date.getMilliseconds()
      );
    };

    Time.equals = function (t1, t2) {
      t1 = Time.parse(t1); t2 = Time.parse(t2);
      if (!t1||!t2) { return false; }
      return t1.offset === t2.offset;
    };

    Time.before = function (a, b, eq) {
      a = Time.parse(a); b = Time.parse(b);
      if (!a||!b) { return false; }
      return !!eq ? a.offset <= b.offset : a.offset < b.offset;
    };

    Time.beforeEq = function (a, b) {
      return Time.before(a, b, true);
    };

    Time.after = function (a, b, eq) {
      a = Time.parse(a); b = Time.parse(b);
      if (!a||!b) { return false; }
      return !!eq ? a.offset >= b.offset : a.offset > b.offset;
    };

    Time.afterEq = function (a, b) {
      return Time.after(a, b, true);
    };

    Time.between = function (t, t1, t2) {
      t = Time.parse(t);
      var t1O = t1.offset, t2O = t2.offset;
      return t.after(Math.min(t1O, t2O), true) && t.before(Math.max(t1O, t2O), true);
    };

    Time.parse = function (str) {

      if (str instanceof Time) {
        return str;
      }

      if (str instanceof Date) {
        return Time.fromDate(str);
      }

      if (angular.isNumber(str)) {
        // check if offset
        if (str < 8.64e7) { return Time.fromOffset(str); }

        // assume ms offset (extract time component only)
        return Time.fromDate(new Date(str));
      }
      else if (angular.isString(str)) {
        var
        rxp = /^([0-9]+)\:?([0-9]*)\:?([0-9]*)\.?([0-9]*)(a|p|am|pm|)?$/i;

        if (!rxp.test(str)) {
          return false;
        }

        var
        match = str.match(rxp),
        h     = parseInt(match[1]),
        m     = parseInt(match[2]),
        s     = parseInt(match[3]),
        ms    = parseInt(match[4]),
        ampm  = (match[5]||'').toLowerCase();

        if (isNaN(h) || h > 23 || m > 59 || s > 59) {
          return false;
        }
        if (h > 12) {
          ampm = false; // ignore ampm check
        }
        if (ampm === 'p'||ampm === 'pm') { // normalize to 24hr:
          h += 12;
        }
        return new Time(h, m, s, ms);
      }

      return false;
    };

    return Time;
  }])

  /**
   * DateRange class
   *
   * Stores a simple JS date range (2 dates maximum). Automatically makes sure
   * "from" is before "to". Because of this "from" and "to" are read-only properties.
   * to change them, you must use the "setDates(d1, d2)" function.
   *
   * Also provides simple abilities like checking if this range contains a certain date,
   * as well as calculating the distance between two dates. Note, this calculation does
   * NOT take into considerations DST offsets, please use the Calendar class, which does
   * handle this correctly.
   */
  .factory('DateRange', function () {

    function DateRange (from, to) {
      this.setDates(from, to);
    }

    Object.defineProperties(DateRange.prototype, {
      from: {
        get: function () { return this._from; }
      },
      to: {
        get: function () { return this._to; }
      },
      offset: {
        get: function () { return this.distanceBetween(); }
      }
    });

    DateRange.prototype.setDates = function (d1, d2) {
      this._from = new Date(Math.min(d1, d2));
      this._to   = new Date(Math.max(d1, d2));
    };

    DateRange.prototype.contains = function (date) {
      if (!date || !this.from || !this.to) { return false; }
      return date >= this.from && date <= this.to;
    };

    DateRange.prototype.distanceBetween = function () {
      return DateRange.distanceBetween(this.from, this.to);
    };

    DateRange.distanceBetween = function (t1, t2) {
      if (!t1||!t2||!t1 instanceof Date||!t2 instanceof Date) {
        return false;
      }
      return Math.abs(t1-t2);
    };

    return DateRange;
  })

  /**
   * TimeRange class
   *
   * Very similar to DateRange, but for Time classes, instead of Dates. These can be dynamically
   * applied to any date.
   */
  .factory('TimeRange', ['Time', 'DateRange', function (Time, DateRange) {

    function TimeRange (from, to) {
      this.setTimes(from, to);
    }

    Object.defineProperties(TimeRange.prototype, {
      from: {
        get: function () { return this._from; }
      },
      to: {
        get: function () { return this._to; }
      },
      offset: {
        get: function () { return this.distanceBetween(); }
      }
    });

    TimeRange.prototype.setTimes = function (t1, t2) {
      var
      t1T = Time.parse(t1), t1O,
      t2T = Time.parse(t2), t2O;

      if (!t1T || !t2T) {
        return;
      }

      t1O = t1T.offset;
      t2O = t2T.offset;

      this._from = Time.parse(Math.min(t1O, t2O));
      this._to   = Time.parse(Math.max(t1O, t2O));
    };

    TimeRange.prototype.toDate = function (date) {
      if (!this.from || !this.to) { return false; }
      return new DateRange(this.from.toDate(date), this.to.toDate(date));
    };

    TimeRange.prototype.distanceBetween = function () {
      return TimeRange.distanceBetween(this.from, this.to);
    };

    TimeRange.prototype.equals = function (tr) {
      return TimeRange.equals(this, tr);
    };

    TimeRange.prototype.before = function (tr, equals) {
      return TimeRange.before(this, tr, equals);
    };

    TimeRange.prototype.beforeEq = function (tr) {
      return this.before(tr, true);
    };

    TimeRange.prototype.after = function (tr, equals) {
      return TimeRange.after(this, tr, equals);
    };

    TimeRange.prototype.afterEq = function (tr) {
      return this.after(tr, true);
    };

    TimeRange.prototype.between = function (a, b) {
      return TimeRange.between(this, a, b);
    };

    TimeRange.prototype.contains = function (t) {
      return TimeRange.contains(this, t);
    };

    TimeRange.distanceBetween = function (t1, t2) {
      if (!t1||!t2||!t1 instanceof Time||!t2 instanceof Time) {
        return false;
      }
      return Math.abs(t1.msOffset()-t2.msOffset());
    };

    TimeRange.equals = function (tr1, tr2) {
      if (!tr1||!tr2||!tr1 instanceof TimeRange||!tr2 instanceof TimeRange) {
        return false;
      }

      return tr1.from.equals(tr2.from) && tr1.to.equals(tr2.to);
    };

    TimeRange.before = function (a, b, equals) {
      if (!a||!b||!a instanceof TimeRange||!b instanceof TimeRange) {
        return false;
      }

      return !!equals ? a.to.before(b.from) || a.to.equals(b.from) : a.to.before(b.from);
    };

    TimeRange.beforeEq = function (tr1, tr2) {
      return TimeRange.before(tr1, tr2, true);
    };

    TimeRange.after = function (a, b, equals) {
      if (!a||!b||!a instanceof TimeRange||!b instanceof TimeRange) {
        return false;
      }

      return !!equals ? a.from.after(b.to) || a.from.equals(b.to) : a.from.before(b.to);
    };

    TimeRange.afterEq = function (tr1, tr2) {
      return TimeRange.after(tr1, tr2, true);
    };

    TimeRange.between = function (tr, a, b) {
      if (!tr||!a||!b||!tr instanceof TimeRange||!a instanceof TimeRange||!b instanceof TimeRange) {
        return false;
      }
      return tr.after(a, true) && tr.before(b, true);
    };

    TimeRange.contains = function (tr, t) {
      if (!tr||!t||!tr instanceof TimeRange||!t instanceof Time) {
        return false;
      }
      return tr.from.after(t, true) && tr.to.before(t, true);
    };

    TimeRange.sorter = function (reverse) {
      return function (a, b) {
        if (!a||!b||!a instanceof TimeRange||!a instanceof TimeRange) { return 0; }
        if (a.after(b)) { return !!reverse ? 1 : -1; }
        if (a.before(b)) { return !!reverse ? -1 : 1; }
        return 0;
      };
    };

    return TimeRange;
  }])

  /**
   * DayGroup class
   *
   * Called it this, for lack of a better name. Allows defining a customizable set of TimeRanges.
   * This set can have an arbitrary title and range of time spans. It does NOT check if these ranges
   * overlap, repeat, etc. That's up to the callee.
   */
  .factory('DayGroup', ['TimeRange', function (TimeRange) {

    function DayGroup (title, range, periods) {
      this._periods = [];
      this.title = title;
      if (angular.isArray(periods) && periods.length) {
        this.addPeriods(periods);
      }
      else if (range) {
        this.addPeriods(DayGroup.periodsFromRange(range, isNaN(periods) ? DayGroup.defaultPeriods : periods));
      }
    }

    DayGroup.defaultPeriods = 3;

    Object.defineProperties(DayGroup.prototype, {
      title: {
        get: function () { return this._title; },
        set: function (v) { this._title = v; }
      },
      range: {
        get: function () { return this._range; }
      },
      periods: {
        get: function () { return this._periods; }
      }
    });

    DayGroup.prototype.$postUpdate = function () {
      this.periods.sort(TimeRange.sorter());
      this._range = DayGroup.rangeFromPeriods(this.periods);
    };

    DayGroup.prototype.applyDate = function (date) {
      return {
        title: this.title,
        range: this.range.toDate(date),
        periods: this.periods.map(function (period) {
          return period.toDate(date);
        })
      };
    };

    DayGroup.prototype.clearPeriods = function () {
      this.periods.splice(0, this.periods.length);
    };
    DayGroup.prototype.addPeriod = function (period) {
      if (!period instanceof TimeRange) { return this; }
      this.periods.push(period);
      if (arguments.length === 1) {
        this.$postUpdate();
      }
      return this;
    };
    DayGroup.prototype.addPeriods = function (periods) {
      if (!periods) { return this; }
      if (!angular.isArray(periods)) {
        periods = [periods];
      }
      periods.forEach(this.addPeriod.bind(this));
      this.$postUpdate();
      return this;
    };
    DayGroup.prototype.setPeriods = function (periods) {
      this.clearPeriods();
      this.addPeriods(periods);
      return this;
    };

    DayGroup.periodsFromRange = function (range, num) {
      if (!range || !range instanceof TimeRange) {
        return false;
      }

      num = (isNaN(num) || num < 1) ? 1 : num;

      var
      periods      = [],
      rangeStartMs = range.from.msOffset(),
      chunkSize    = Math.round(range.offset / num),
      i;

      for(i=0; i < num; i++) { periods.push(
        new TimeRange(rangeStartMs + (i*chunkSize), rangeStartMs + (((i+1)*chunkSize)-1))
      ); }

      return periods;
    };

    DayGroup.rangeFromPeriods = function (periods) {
      if (!angular.isArray(periods) || !periods.length) { return false; }

      var lfrom, lto;
      periods.forEach(function (period) {
        if (!period instanceof TimeRange) { return; }
        if (!lfrom || lfrom.after(period.from)) { lfrom = period.from; }
        if (!lto   || lto.before(period.to))    { lto   = period.to; }
      });

      return new TimeRange(lfrom, lto);
    };

    DayGroup.sorter = function (reverse) {
      var trSort = TimeRange.sorter(reverse);
      return function (a, b) {
        return trSort(a.range, b.range);
      };
    };

    return DayGroup;
  }])

  /**
   * Day class
   *
   * Essentially a container for DayGroup classes. Allows applying an arbitrary date against
   * the set of the groups to generate a new simplified group which inherit the date settings
   * while keeping the time ranges defined in the group. This container also keeps track of it's
   * internal range of times (as defined by the group). So when new group(s) are added, the range
   * is updated automatically.
   */
  .factory('Day', ['TimeRange', 'DayGroup', 'Calendar', function (TimeRange, DayGroup, Calendar) {

    function Day (groups) {
      this._groups = [];
      this.setGroups(groups||Day.dayPeriodGroups(Day.defaultGroups, DayGroup.defaultPeriods));
    }

    Day.defaultGroups = 3;
    Day.defaultGroupTitles = ['Morning','Afternoon','Evening'];

    Object.defineProperties(Day.prototype, {
      groups: {
        get: function () { return this._groups; }
      },
      range: {
        get: function () { return this._range; }
      }
    });

    Day.prototype.$postUpdate = function () {
      this.groups.sort(DayGroup.sorter());
      this._range = Day.rangeFromGroups(this.groups);
    };
    Day.prototype.clearGroups = function () {
      this.groups.splice(0, this.groups.length);
    };
    Day.prototype.addGroup = function (group) {
      if (!group instanceof DayGroup) { return this; }
      this.groups.push(group);
      if (arguments.length === 1) {
        this.$postUpdate();
      }
      return this;
    };
    Day.prototype.addGroups = function (groups) {
      if (!groups) { return this; }
      if (!angular.isArray(groups)) {
        groups = [groups];
      }
      groups.forEach(this.addGroup.bind(this));
      this.$postUpdate();
      return this;
    };
    Day.prototype.setGroups = function (groups) {
      this.clearGroups();
      this.addGroups(groups);
      return this;
    };

    Day.prototype.applyDate = function (date) {
      var thisRange = this.range;
      return {
        date: date,
        range: thisRange.toDate(date),
        groups: this.groups.map(function (group) {
          return group.applyDate(date);
        })
      };
    };

    Day.dayPeriodGroups = function (groups, periods, groupTitles) {
      groups = isNaN(groups) ? 1 : groups;
      periods = isNaN(periods) ? 1 : periods;
      groupTitles = groupTitles || Day.defaultGroupTitles;

      var
      perGroups   = [],
      groupSize   = Math.round(8.64e7 / groups),
      g, goffset;

      for(g=0; g < groups; g++) {
        goffset  = (g*groupSize);
        perGroups.push(new DayGroup(groupTitles[g], new TimeRange(goffset, goffset + (groupSize - 1))));
      }

      return perGroups;
    };

    Day.rangeFromGroups = function (groups) {
      if (!angular.isArray(groups) || !groups.length) { return false; }

      var lfrom, lto;
      groups.forEach(function (group) {
        if (!group instanceof DayGroup) { return; }
        if (!lfrom || lfrom.after(group.range.from)) { lfrom = group.range.from; }
        if (!lto   || lto.before(group.range.to))    { lto   = group.range.to; }
      });

      return new TimeRange(lfrom, lto);
    };

    return Day;
  }])

  /**
   * DateStore class
   *
   * A class for storing records of data with a date property. Also has a method
   * to query data between a date range using an efficient binary search algorithm.
   */
  .factory('DateStore', ['DateRange', function (DateRange) {
    function DateStore (dateProperty, records) {
      this._records = [];
      this.dateProperty = dateProperty || 'date';
      this.setRecords(records);
    }

    Object.defineProperties(DateStore.prototype, {
      records: {
        get: function() { return this._records.slice(); } // prevents modification of internal _records!
      },
      dates: {
        get: function() { return this._dates.slice(); } // ditto.
      },
      length: {
        get: function() { return this._records.length; }
      },
      dateProperty: {
        get: function () { return this._dateProperty; },
        set: function (v) {
          this._dateProperty = v;
          this.$postUpdate();
        }
      }
    });

    DateStore.prototype.$postUpdate = function () {
      var prop = this.dateProperty;
      if(!prop) { return; }
      this._records.sort(DateStore.sorter(prop));
      this._dates = this._records.map(function (r) {
        return r[prop];
      });
    };
    DateStore.prototype.slice = function (start, end) {
      return this._records.slice(start, end);
    };
    DateStore.prototype.clearRecords = function () {
      this._records.splice(0, this.records.length);
      this.$postUpdate();
    };
    DateStore.prototype.addRecord = function (record) {
      if(!record || (!angular.isObject(record) && !angular.isArray(record))) {
        return this;
      }

      this._records.push(record);

      if(arguments.length === 1) {
        this.$postUpdate();
      }

      return this;
    };
    DateStore.prototype.addRecords = function (records) {
      if(!records) {
        return this;
      }

      if(!angular.isArray(records)) {
        records = [records];
      }

      records.forEach(this.addRecord.bind(this));
      this.$postUpdate();

      return this;
    };
    DateStore.prototype.setRecords = function (records) {
      this.clearRecords();
      this.addRecords(records);
      return this;
    };
    DateStore.prototype.queryDateRange = function (range) {
      if(!range || !range instanceof DateRange) {
        return this.records;
      }

      var
      bsRange = DateStore.binarySearchRange(range, this.dates);

      if(!bsRange) {
        return [];
      }

      return this.slice(bsRange.start, bsRange.end);
    };

    /**
    ** Binary search for nearest date in array of date objects.
    **
    ** example 1:
    ** >> 01-01-2000 05:30:00 << with arrDates [
    **   '01-01-2000 03:00:00',
    **   '01-01-2000 04:00:00',
    **   '01-01-2000 05:00:00',
    **   '01-01-2000 06:00:00'
    ** ]
    **
    ** matches:
    **   01-01-2000 05:00:00
    **
    ** >> 01-01-2000 05:31:00 <<
    **
    ** matches:
    **   01-01-2000 06:00:00
    **/
    DateStore.binarySearchNearestDate = function (date, arrDates) {

      var
      minIndex = 0,
      maxIndex = arrDates.length - 1,
      currentIndex, currentDate, currentDistance;

      var lDist, lIndex = -1;

      while (minIndex <= maxIndex) {
        currentIndex = (minIndex + maxIndex) / 2 | 0;
        currentDate = arrDates[currentIndex];
        currentDistance = Math.abs(date - currentDate);

        if (currentDate < date) {
          minIndex = currentIndex + 1;
        }
        else if (currentDate > date) {
          maxIndex = currentIndex - 1;
        }
        else {
          return currentIndex;
        }

        if((lDist === undefined) || currentDistance < lDist) {
          lDist = currentDistance;
          lIndex = currentIndex;
        }
      }

      return lIndex; // returns closest match
    };

    /**
    ** Binary search indexes between date range.
    **/
    DateStore.binarySearchRange = function (range, dates) {
      var start, end, min = range.from, max = range.to, centre;

      var low = 0, high = dates.length - 1;

      while (high - low > 1) {
        centre = Math.floor((high + low) / 2);
        if (dates[centre] < min) {
          low = centre;
        }
        else {
          high = centre;
        }
      }

      start = low;

      while (start <= high && dates[start] < min) {
        start++;
      }

      high = dates.length - 1;

      while (high - low > 1) {
        centre = Math.floor((high + low) / 2);
        if (dates[centre] > max) {
          high = centre;
        }
        else {
          low = centre;
        }
      }

      end = high;
      while (end >= low && dates[end] > max) {
        end--;
      }

      var
      length = end - start + 1;

      if(length === 0) {
        return false;
      }

      return {
        start: start,
        end: start + length,
        length: length
      };
    };

    DateStore.sorter = function (prop, reverse) {
      prop = prop || 'date';
      return function (a, b) {
        if(!a || !b || !a[prop] || !b[prop]) {
          return false;
        }

        if(a[prop] > b[prop]) {
          return !!reverse ? -1 :  1;
        }

        if(a[prop] < b[prop]) {
          return !!reverse ?  1 : -1;
        }
        return 0;
      };
    };

    return DateStore;
  }])

  /**
   * join filter function
   *
   * A very simple filter for joining an array using a configurable delimiter.
   */
  .filter('join', [function () {
    return function (v, delimiter) {
      delimiter = delimiter || ', ';

      if(angular.isArray(v)) {
        return v.join(delimiter);
      }

      return v;
    };
  }])

  /**
   * time filter function
   *
   * Uses the angular date filter to format a Time object.
   * Supports all TIME format parameters that angular date filter supports.
   */
  .filter('time', ['$filter','Time', function ($filter, Time) {
    var
    dateFilter = $filter('date'),
    fullTimeFmt = 'fullTime';
    return function (v, format) {

      if(!v) {
        return '';
      }
      else if(v instanceof Date) {
        if(format === fullTimeFmt) {
          return Time.fromDate(v).toString();
        }

        return dateFilter(v, format); // use date filter if v = date
      }
      else if(!v instanceof Time) {
        return '';
      }

      if(format === fullTimeFmt) {
        return v.toString();
      }

      return dateFilter(v.toDate(new Date()), format);
    };
  }])

  /**
   * dateRange filter function
   *
   * Uses the angular date and join filters to reender a date range to a string.
   * Supports all format parameters that angular date filter supports.
   */
  .filter('dateRange', ['$filter', 'DateRange', function ($filter, DateRange) {
    var
    joinFilter = $filter('join'),
    timeFilter = $filter('time'),
    dateFilter = $filter('date');

    return function (v, format, toFormat, delimiter) {
      format    = format    || 'fullDate';
      toFormat  = toFormat  || format;
      delimiter = delimiter || ' to ';
      var items = [];

      if(!v || !v instanceof DateRange) {
        return '';
      }

      if(v.from) {
        items.push(dateFilter(v.from, format));
      }

      if(v.to) {
        items.push(dateFilter(v.to, toFormat));
      }

      return joinFilter(items, delimiter);
    };
  }])

  /**
   * timeRange filter function
   *
   * Very similar to the dateRange filter, but for formatting TimeRange objects.
   */
  .filter('timeRange', ['$filter','TimeRange', function ($filter, TimeRange) {
    var
    joinFilter = $filter('join'),
    timeFilter = $filter('time');

    return function (v, format, toFormat, delimiter) {
      delimiter = delimiter || ' to ';
      format    = format    || 'fullTime';
      toFormat  = toFormat  || format;
      if(!v || !v instanceof TimeRange) {
        return '';
      }

      var items = [];

      if(v.from) {
        items.push(timeFilter(v.from, format));
      }

      if(v.to) {
        items.push(timeFilter(v.to,   toFormat));
      }

      return joinFilter(items, delimiter);
    };
  }]);

})(window, window.angular);