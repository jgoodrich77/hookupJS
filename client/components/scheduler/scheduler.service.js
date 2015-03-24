'use strict';

angular
.module('auditpagesApp')

.factory('ScheduleDataLoader', function ($q, CalendarWeek) {

  function ScheduleDataLoader(calendar) {
    this.reset();
    this.calendar = calendar;
  }

  Object.defineProperties(ScheduleDataLoader.prototype, {
    calendar: {
      get: function()  { return this._calendar; },
      set: function(v) {
        if(!v instanceof CalendarWeek) return;
        this._calendar = v;
      }
    },
    loading: {
      get: function() { return this._loading; }
    },
    softLoading: {
      get: function() { return  this._hasLoaded && this.loading; }
    },
    fullLoading: {
      get: function() { return !this._hasLoaded && this.loading; }
    }
  });

  ScheduleDataLoader.prototype.reset = function () {
    this._hasLoaded = false;
    this._loading = false;
  };

  ScheduleDataLoader.prototype.getWeekDateRange = function (year, weekNumber) {
    if(!this.calendar) return false;
    return this.calendar.getWeekDates(year, weekNumber);
  };

  ScheduleDataLoader.prototype.query = function(dateRange) { // should be implemented by child class
    return [];
  };

  ScheduleDataLoader.prototype.load = function(dateProperty) {
    this._loading = true;
    return $q.when(this.query(this.getWeekDateRange()))
      .then((function (data) {
        this.calendar.loadData(data, dateProperty, true);
        return data;
      }).bind(this))
      .finally((function () {
        this._loading = false;
        this._hasLoaded = true;
      }).bind(this));
  };

  return ScheduleDataLoader;
})

.factory('ScheduleDataFuture', function ($http, ScheduleDataLoader) {

  function ScheduleDataFuture(calendar) {
    ScheduleDataLoader.call(this, calendar);
  }

  ScheduleDataFuture.prototype = new ScheduleDataLoader;
  ScheduleDataFuture.prototype.constructor = ScheduleDataFuture;

  Object.defineProperties(ScheduleDataFuture.prototype, {
  });

  ScheduleDataFuture.prototype.query = function (dateRange) {
    return $http.get('/api/user-schedule/posts-pending', {
      params: {
        dateStart: dateRange.from,
        dateEnd: dateRange.to
      }
    }).then(function (results) {
      return results.data.map(function (result) {
        result.date = result.scheduledFor;
        return result;
      });
    });
  };

  return ScheduleDataFuture;
})

.factory('ScheduleDataFB', function ($fb, ScheduleDataLoader) {

  function ScheduleDataFB(calendar, fbObjectId, fbAuthToken) {
    ScheduleDataLoader.call(this, calendar);
    this.fbObjectId  = fbObjectId;
    this.fbAuthToken = fbAuthToken;
  }

  ScheduleDataFB.prototype = new ScheduleDataLoader;
  ScheduleDataFB.prototype.constructor = ScheduleDataFB;

  Object.defineProperties(ScheduleDataFB.prototype, {
    fbObjectId: {
      get: function() { return this._facebookObjectId; },
      set: function(v) { this._facebookObjectId = v; }
    },
    fbAuthToken: {
      get: function() { return this._facebookAuthToken; },
      set: function(v) { this._facebookAuthToken = v; }
    },
    valid: {
      get: function() { return !!this.fbObjectId && !!this.fbAuthToken; }
    }
  });

  ScheduleDataFB.fixFacebookDate = function (date) {
    var fixedStr = (date||'').replace('+0000','.000Z');
    return new Date(fixedStr);
  };

  ScheduleDataFB.prototype.query = function (dateRange) {
    if(!this.valid) return false;

    return $fb.getObjectPosts({
      id: this.fbObjectId,
      access_token: this.fbAuthToken,
    }, dateRange.from, dateRange.to, ['id', 'updated_time', 'created_time', 'status_type', 'type'])
      .then(function (results) {
        return results.data.map(function (post) { // facebook sends us weird dates, fix them:
          post.date = ScheduleDataFB.fixFacebookDate(post.created_time);
          return post;
        });
      });
  };

  return ScheduleDataFB;
})

.factory('ScheduleDataAggr', function (ScheduleDataFB, ScheduleDataFuture, ScheduleDataLoader) {

  function ScheduleDataAggr(calendar, fbObjectId, fbAuthToken) {
    ScheduleDataLoader.call(this, calendar);

    this.loaderFb     = new ScheduleDataFB(calendar, fbObjectId, fbAuthToken);
    this.loaderFuture = new ScheduleDataFuture(calendar);
  }

  ScheduleDataAggr.prototype = new ScheduleDataLoader;
  ScheduleDataAggr.prototype.constructor = ScheduleDataAggr;

  ScheduleDataAggr.prototype.query = function (dateRange) {
    var
    now            = new Date,
    includesFuture = dateRange.from > now,
    includesPast   = dateRange.to   < now;

    if(!includesFuture) { // historical only view
      return this.loaderFb.query(dateRange);
    }
    else if(!includesPast) { // future only view
      return this.loaderFuture.query(dateRange);
    }
    else { // aggregated view
      return this.loaderFuture.query(dateRange)
        .then((function (futureData) {

          var aggregated = [];

          if(futureData) {
           Array.prototype.push.apply(aggregated, futureData);
          }

          return this.loaderFb.query(dateRange)
            .then(function (facebookData) {
             Array.prototype.push.apply(aggregated, facebookData);
             return aggregated;
            });
        }).bind(this));
    }
  };

  return ScheduleDataAggr;
})

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
    }
  });

  DateRange.prototype.setDates = function (d1, d2) {
    this._from = new Date(Math.min(d1, d2));
    this._to   = new Date(Math.max(d1, d2));
  };

  return DateRange;
})

.factory('DayBuckets', function (Calendar, DateRange, Time) {
  function DayBuckets(segments) {
    this._segments = [];

    this.setSegments(segments || [
      { start: '00:00', end: '08:59:59.999' },
      { start: '09:00', end: '11:59:59.999' },
      { start: '12:00', end: '20:59:59.999' },
      { start: '21:00', end: '23:59:59.999' }
    ]);
  }

  Object.defineProperties(DayBuckets.prototype, {
    segments: {
      get: function () {
        return this._segments;
      }
    }
  });

  DayBuckets.isBetween = function(d, d1, d2) {
    d  = Calendar.now(d);
    d1 = Calendar.now(d1);
    d2 = Calendar.now(d2);

    if(!d || !d1 || !d2) return false;

    var
    range = new DateRange(d1, d2);

    return d >= range.from && d <= range.to;
  };

  DayBuckets.prototype.setSegments = function (segments) {
    this._segments.splice(0, this._segments.length);
    if(!angular.isArray(segments)) return false;

    segments.forEach((function (segment, index) {

      var
      timeStart = Time.parse(segment.start),
      timeEnd   = Time.parse(segment.end),
      group     = segment.group;

      if(!timeStart || !timeEnd) return;

      this._segments.push({
        group: group,
        start: timeStart,
        end:   timeEnd,
        matcher: function(date) {

          var
          startDate = timeStart.toDate(date),
          endDate   = timeEnd.toDate(date);

          return function (v) {
            return DayBuckets.isBetween(v, startDate, endDate);
          }
        }
      });
    }).bind(this));
  };

  return DayBuckets;
})

.factory('CalendarWeek', function ($log, Calendar, DayBuckets) {
  function CalendarWeek(boW, year, week, segments) {
    this.dayBuckets = new DayBuckets(segments);
    Calendar.apply(this, [boW, year, week]);
  }

  CalendarWeek.prototype = new Calendar;
  CalendarWeek.prototype.constructor = CalendarWeek;

  Object.defineProperties(Calendar.prototype, {
    weekGrid: {
      get: function () {
        if(!this._lWeekGrid) this.reloadWeekGrid();
        return this._lWeekGrid;
      }
    },
    segmentedGrid: {
      get: function () {
        if(!this._lWeekSegments) this.reloadWeekSegments();
        return this._lWeekSegments;

      }
    }
  });

  CalendarWeek.prototype.setSegments = function (spec) {
    this.dayBuckets.setSegments(spec);
    this.reloadWeekGrid();
    return this;
  };

  CalendarWeek.prototype.clearData = function () {
    this.weekGrid.forEach(function (day) {
      day.segments.forEach(function (segment) {
        segment.data.splice(0, segment.data.length);
      });
    });
    return this;
  };

  CalendarWeek.prototype.loadData = function (data, dateProperty, clear) {
    clear = (clear === undefined) ? true : !!clear;
    data = data || [];
    dateProperty = dateProperty || 'date';

    if(clear) this.clearData();

    data.forEach((function (record) {
      if(!record || record[dateProperty] === undefined) return;

      var
      date = Calendar.now(record[dateProperty]),
      found = false;

      this.weekGrid.every(function (day) {
        if(!DayBuckets.isBetween(date, day.dayStart, day.dayEnd)) return true;

        // find specific segment bucket
        day.segments.every(function (segment) {
          if(!segment.matches(date)) return true;

          segment.data.push(record);
          found = true;
          return false;
        });

        return !found;
      });

      if(!found) {
        $log.debug('No bucket found for record:', record);
      }
    }).bind(this));

    //
    // this.reloadWeekSegments();
  };

  CalendarWeek.prototype.reloadWeekSegments = function () {
    var segs = this._lWeekSegments = [];

    this.weekGrid.forEach(function (day) {
      day.segments.forEach(function (segment, index) {

        if(segs[index] === undefined) segs[index] = {
          segment: {
            start: segment.timeStart,
            end:   segment.timeEnd
          },
          days: []
        };

        segs[index].days.push({
          start:   day.dayStart,
          end:     day.dayEnd,
          segment: {
            start: segment.start,
            end:   segment.end
          },
          data:    segment.data
        });
      });
    });

    return this._lWeekSegments;
  }

  CalendarWeek.prototype.reloadWeekGrid = function () {
    this._lWeekGrid = [];

    this.weekDates.forEach((function (date) {
      this._lWeekGrid.push({
        dayStart: Calendar.nowFloor(date),
        dayEnd:   Calendar.nowCeil(date),
        segments: this.dayBuckets.segments.map(function (segment) {
          return {
            group:     segment.group,
            timeStart: segment.start,
            timeEnd:   segment.end,
            start:     segment.start.toDate(date),
            end:       segment.end.toDate(date),
            matches:   segment.matcher(date),
            data:      []
          };
        })
      });
    }).bind(this));

    return this._lWeekGrid;
  };

  CalendarWeek.prototype.reloadWeekDates = function () {
    Calendar.prototype.reloadWeekDates.call(this);
    this.reloadWeekGrid();
    this.reloadWeekSegments();
    return this;
  };

  CalendarWeek.prototype.shiftWeek = function (dir) {
    this.week += dir;
    return this;
  };

  return CalendarWeek;
})

.factory('Calendar', function (DateRange, $numberUtil) {
  function Calendar(boW, year, week) {
    this._boW = Calendar.DEFAULT_BOW;
    this.beginningOfWeek = boW;

    if(year && week) {
      this.year = year;
      this.week = week;
    }
    else {
      this.toToday();
    }
  }

  Object.defineProperties(Calendar.prototype, {
    beginningOfWeek: {
      get: function() { return this._boW; },
      set: function(v) {
        if(!Calendar.validBeginningOfWeek(v)) return;
        this._boW = v;
        this.reloadWeekDates();
      }
    },
    week: {
      get: function () { return this._week; },
      set: function(v) {
        var xclamped =  $numberUtil.clamp(v, 0, 54);

        if(xclamped > 53) {
          this.year++;
          xclamped = 1;
        }
        else if(xclamped < 1) {
          this.year--;
          xclamped = 53;
        }

        this._week = xclamped;
        this.reloadWeekDates();
      }
    },
    year: {
      get: function () { return this._year; },
      set: function(v) {
        this._year = $numberUtil.clamp(v, 0);
        this.reloadWeekDates();
      }
    },
    dateRange: {
      get: function () {
        return this.getWeekDates(this.year, this.week);
      }
    },
    weekDates: {
      get: function () {
        if(!this._lWeekDates) this.reloadWeekDates();
        return this._lWeekDates;
      }
    },
    isThisWeek: {
      get: function () {
        return this.week === this.nowWeek
            && this.year === this.nowYear;
      }
    },
    now: {
      get: function () {
        return new Date;
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
    return !(isNaN(v)||v<0||v>6);
  };

  Calendar.validMonth = function (v) {
    return !(isNaN(v)||v<0||v>11);
  };

  Calendar.now = function (now) {
    if(angular.isNumber(now)||angular.isString(now))
      return new Date(now);
    return (now instanceof Date)
      ? new Date(now) // so no modding original
      : new Date();
  };

  Calendar.nowFloor = function (now) {
    now = Calendar.now(now);
    now.setHours(0,0,0,0);
    return now;
  };

  Calendar.nowCeil = function (now) {
    now = Calendar.now(now);
    now.setHours(23,59,59,999);
    return now;
  };

  Calendar.isLeapYear = function (year) {
    return ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0);
  };

  Calendar.isSameDay = function(date, now) {
    date = Calendar.now(date);
    now  = Calendar.now(now);

    if(!date||!now) return false;

    return date.getFullYear() === now.getFullYear() &&
           date.getMonth()    === now.getMonth() &&
           date.getDate()     === now.getDate();
  };

  Calendar.isFuture = function(date, now) {
    now = Calendar.now(now);
    date = Calendar.now(date);

    if(!date||!now) return false;

    return date > now;
  };

  Calendar.isPast = function(date, now) {
    now = Calendar.now(now);
    date = Calendar.now(date);

    if(!date||!now) return false;

    return date < now;
  };

  Calendar.dateOffset = function (offset, now, unit) {
    unit = (unit || 'ms').toLowerCase();
    now = Calendar.now(now);
    offset = isNaN(offset) ? 0 : offset;

    var
    ntime = now.getTime(),
    applyOffset = false;

    switch(unit) {
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

    var
    offsetDate = new Date(ntime + (applyOffset ? Math.round(offset) : 0));

    if(!applyOffset) {

      var // preserve these
      origYear         = offsetDate.getFullYear(),
      origMonth        = offsetDate.getMonth(),
      origDate         = offsetDate.getDate(),
      origHrs          = offsetDate.getHours(),
      origMin          = offsetDate.getMinutes(),
      origSec          = offsetDate.getSeconds(),
      origMS           = offsetDate.getMilliseconds(),
      isLeapYear       = Calendar.isLeapYear(origYear),
      isLastDayOfMonth = Calendar.isLastDateOfMonth(origYear, origMonth, origDate);

      switch(unit) {
        case 'months':
        case 'month':

        var
        expectMonth = Calendar.clampMonth(origMonth+offset),
        expectYear  = origYear + Math.floor((origMonth+offset)/12),
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

        if((isLeapYear || Calendar.isLeapYear(offsetYear)) && isLastDayOfMonth)
          offsetDate.setMonth(origMonth, Calendar.getLastDayOfMonth(offsetYear, origMonth));

        break;
      }

      // restore any DST changes that might have occurred
      offsetDate.setHours(origHrs, origMin, origSec, origMS);
    }

    return offsetDate;
  };

  Calendar.utcOffset = function (date, offset) {
    offset = (isNaN(offset)
      ? Calendar.now(date).getTimezoneOffset()
      : offset);

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
    if(offset > 0) offset -= Calendar.MS_PER_WEEK;
    return Calendar.dateOffset(offset, date);
  };

  Calendar.bowBefore = function (date, bow) {
    var offset = Calendar.bowOffset(date, bow);
    if(offset >= 0) offset -= Calendar.MS_PER_WEEK;
    return Calendar.dateOffset(offset, date);
  };

  Calendar.bowEqAfter = function (date, bow) {
    var offset = Calendar.bowOffset(date, bow);
    if(offset < 0) offset += Calendar.MS_PER_WEEK;
    return Calendar.dateOffset(offset, date);
  };

  Calendar.bowAfter = function (date, bow) {
    var offset = Calendar.bowOffset(date, bow);
    if(offset <= 0) offset += Calendar.MS_PER_WEEK;
    return Calendar.dateOffset(offset, date);
  };

  Calendar.clampMonth = function (month) {
    return $numberUtil.clamp((12+(month%12))%12, 0, 11, 0);
  };

  Calendar.getBeginningOfYear = function (year) {
    return Calendar.getFirstDateOfMonth(year, 0);
  };

  Calendar.getFirstWeekDateOfYear = function (year, bow) {
    return Calendar.bowEqBefore(Calendar.getBeginningOfYear(year), bow);
  };

  Calendar.getFirstDateOfMonth = function (year, month) {
    if(!Calendar.validMonth(month)) month = (new Date).getMonth();
    year = year || (new Date).getFullYear();
    return new Date(year, month, 1, 0, 0, 0);
  };

  Calendar.getLastDateOfMonth = function (year, month) {
    if(!Calendar.validMonth(month)) month = (new Date).getMonth();
    year = year || (new Date).getFullYear();
    var nmonth = month + 1, date;
    if(nmonth === 12) { year++; nmonth = 0; }
    return Calendar.dateOffset(-1, Calendar.getFirstDateOfMonth(year, nmonth));
  };

  Calendar.isLastDateOfMonth = function (year, month, date) {
    return (date === Calendar.getLastDayOfMonth(year, month));
  };

  Calendar.getFirstDayOfMonth = function (year, month) {
    var ndate = Calendar.getFirstDateOfMonth(year, month);
    if(!ndate) return false;
    return ndate.getDate();
  };

  Calendar.getLastDayOfMonth = function (year, month) {
    var ndate = Calendar.getLastDateOfMonth(year, month);
    if(!ndate) return false;
    return ndate.getDate();
  };

  Calendar.dateUnDST = function(date, relTzOffset) {
    date = Calendar.now(date);
    relTzOffset = isNaN(relTzOffset)
      ? Calendar.getFirstWeekDateOfYear(date.getFullYear()).getTimezoneOffset()
      : relTzOffset;

    var
    dateTzOffset = date.getTimezoneOffset();

    if(dateTzOffset !== relTzOffset) {
      date.setTime(date.getTime() + ((dateTzOffset - relTzOffset) * 60000));
    }

    return date;
  };

  Calendar.dateWeek = function(date, bow, withYear) {
    date = Calendar.now(date);

    var
    firstWeekDate = Calendar.getFirstWeekDateOfYear(date.getFullYear(), bow);

    // set time to match date's to prevent un-wanted rounding problems.
    firstWeekDate.setHours(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());

    var
    dateOffset    = ((date - firstWeekDate) / Calendar.MS_PER_DAY) + 1,
    weekNumber    = Math.ceil(dateOffset / Calendar.DAY_PER_WEEK);

    if(withYear)
      return [date.getFullYear(), weekNumber];

    return weekNumber;
  };

  Calendar.weekDates = function (year, week, bow) {
    year = year || Calendar.now().getFullYear();
    week = week || Calendar.dateWeek(null, bow, false);

    var
    weekNumber;

    if(angular.isArray(week)) weekNumber = week[1];
    else                      weekNumber = isNaN(week) ? 1 : week;

    var
    weekOffset    = Calendar.MS_PER_WEEK * (weekNumber - 1),
    firstWeekDate = Calendar.getFirstWeekDateOfYear(year, bow),
    weekStart     = Calendar.dateUnDST(firstWeekDate.getTime() + weekOffset, firstWeekDate.getTimezoneOffset()),
    weekEnd       = Calendar.dateUnDST(weekStart.getTime() + (Calendar.MS_PER_WEEK - 1), weekStart.getTimezoneOffset());

    return new DateRange(weekStart, weekEnd);
  };

  Calendar.prototype.isSameDay = Calendar.isSameDay;

  Calendar.prototype.reloadWeekDates = function () {
    this._lWeekDates = [];

    var
    i, range = this.dateRange,
    endTime = range.to.getTime();

    for(i=range.from.getTime(); i <= endTime; i += Calendar.MS_PER_DAY) {
      this._lWeekDates.push(new Date(i));
    }

    return this._lWeekDates;
  };

  Calendar.prototype.getWeekNumber = function (date, withYear) {
    return Calendar.dateWeek(date, this.beginningOfWeek, withYear);
  };

  Calendar.prototype.getWeekDates = function (year, week) {
    return Calendar.weekDates(year||this.year, week||this.week, this.beginningOfWeek);
  };

  Calendar.prototype.toToday = function () {
    this._year = this.nowYear;
    this._week = this.nowWeek;
    this.reloadWeekDates();
  };

  return Calendar;
})
.service('$numberUtil', function () {

  function normalize (n, def) {
    def = isNaN(def) ? 0 : def;
    return isNaN(n) ? def : n;
  }

  function clamp (v, min, max, precision) {
    if(isNaN(v))    v = 0;
    if(!isNaN(min)) v = Math.max(v, min);
    if(!isNaN(max)) v = Math.min(v, max);
    if(!isNaN(precision)) {
      var f = Math.pow(10, precision);
      v = Math.round(v * f) / f;
    }

    return v;
  };

  return {
    normalize: normalize,
    clamp: clamp
  };
});