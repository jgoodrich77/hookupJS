'use strict';

angular
.module('auditpagesApp')
.factory('Scheduler', function() {
  function Scheduler(plan, data, opts) {

    this.getPlan = function() {
      return plan;
    };
    this.getData = function() {
      return data;
    };
    this.canShiftNext = function() {
      return !this.isLoading() && this.getPlan().canShift(1, opts.maxDate);
    };
    this.canShiftPrevious = function() {
      return !this.isLoading() && this.getPlan().canShift(-1, opts.minDate);
    };
    this.shiftNext = function() {
      this.getPlan().shift(1);
      return this.reloadData();
    };
    this.shiftPrevious = function() {
      this.getPlan().shift(-1);
      return this.reloadData();
    };
    this.reloadData = function() {
      return this.getData().reload();
    };
    this.isLoading = function() {
      return this.getData().isLoading();
    };

    if(opts.autoLoad) {
      this.reloadData();
    }
  }
  return Scheduler;
})

.factory('ScheduleData', function ($log, $fb, $week, $q, $timeout, $http, $inherit, Time, CacheMemory) {

  function ScheduleDataLoader(opts) {
    var loading = false, hasLoaded = false;
    this.reset = function () {
      hasLoaded = false;
      loading = false;
    };
    this.isLoading = function() {
      return loading;
    };
    this.query = function(year, weekNumber) { // should be implemented by child class
      return [];
    };
    this.hasLoaded = function () {
      return hasLoaded;
    };
    this.load = function(year, weekNumber) {
      loading = true;
      return $q.when(this.query(year, weekNumber))
        .finally(function(){
          loading = false;
          hasLoaded = true;
        });
    };
  }

  function ScheduleData(plan, opts) {
    opts = opts || {};
    var loader = opts.loader || false;
    var cache = new CacheMemory();
    var rowDateProperty = opts.rowDateProperty || 'date';

    function cacheKey(period, date) {
      var
      start = Time.parse(period.start),
      end   = Time.parse(period.end);

      if(!start || !end) {
        throw new Error('Invalid period start / end');
      }

      var
      startKey = start.toDate(date),
      endKey   = end.toDate(date);

      return startKey.getTime() + '-' + endKey.getTime();
    }

    this.getAllPeriods = function() {
      return plan.getSegments()
        .reduce(function (p, c) { // only care about periods, concat them all together.
          if(c.periods) {
            p = p.concat(c.periods.map(function (p) {
              return {
                start: Time.parse(p.start),
                end: Time.parse(p.end)
              }
            }));
          }
          return p;
        }, [])
        .sort(function(a, b) {

          var
          aS = a.start, bS = b.start,
          asH = aS.getHours(), asM = aS.getMinutes(), asS = aS.getSeconds(), asMS = aS.getMilliseconds(),
          bsH = bS.getHours(), bsM = bS.getMinutes(), bsS = bS.getSeconds(), bsMS = bS.getMilliseconds();

          if(asH !== bsH) {
            if(asH > bsH) return  1;
            if(asH < bsH) return -1;
          }
          if(asM !== bsM) {
            if(asM > bsM) return  1;
            if(asM < bsM) return -1;
          }
          if(asS !== bsS) {
            if(asS > bsS) return  1;
            if(asS < bsS) return -1;
          }
          if(asMS !== bsMS) {
            if(asMS > bsMS) return  1;
            if(asMS < bsMS) return -1;
          }
        });
    };

    this.reset = function () {
      cache.reset();
      if(!this.hasLoader()) return;
      loader.reset();
    };

    this.reload = function() {
      cache.reset();
      if(!this.hasLoader()) return $q.when(false);

      var // prepare period index engine:
      periods = this.getAllPeriods(),
      buckets = [];

      plan.getDates().forEach(function (date) {
        periods.forEach(function (period) {
          buckets.push((function (p, d) {

            var
            msStart  = p.start.toDate(d).getTime(),
            msEnd    = p.end.toDate(d).getTime(),
            bucketId = cacheKey(p, d);

            return function (test) {
              var ms = test instanceof Date ? test.getTime() : Date.parse(test).getTime();
              if(!ms) return false;
              return (ms >= msStart && ms <= msEnd) ? bucketId : false;
            };
          })(period, date));
        });
      });

      return $q.when(loader.load(plan.getYear(), plan.getWeekNumber()))
        .then(function (data) { // seed our cache
          if(!angular.isArray(data)) return false;

          data.forEach(function (entry) {
            var
            rowDate = new Date(entry[rowDateProperty]),
            matched = !buckets.every(function (bucket) {
              var bucketId = bucket(rowDate);
              if(!bucketId) return true; // keep looking

              var cbucket = cache.has(bucketId)
                ? cache.get(bucketId)
                : cache.set(bucketId, []);

              cbucket.push(entry);

              return false;
            });

            if(!matched) {
              $log.warn('No bucket match for data', rowDate, entry);
            }
          });

          return data;
        });
    };

    this.hasLoaded = function () {
      return this.hasLoader() && loader.hasLoaded();
    };
    this.getRecord = function(period, date) {
      return (cache.get(cacheKey(period, date))||[]);
    };
    this.isLoading = function() {
      if(!this.hasLoader()) return false;
      return loader.isLoading();
    };
    this.hasLoader = function() {
      return !!loader && (loader instanceof ScheduleDataLoader);
    };
    this.getLoader = function () {
      return loader;
    };
    this.setLoader = function (l) {
      loader = l;
      return this;
    };
  }

  // base loader class
  ScheduleData.Loader = ScheduleDataLoader;

  var boW = 0;

  ScheduleData.LoaderHttp = function(opts) {
    ScheduleDataLoader.call(this, opts);
    opts        = opts || {};
    opts.params = opts.params || {};

    var
    propYear    = opts.propertyYear       || 'year',
    propWeekNum = opts.propertyWeekNumber || 'weekNumber';

    delete opts.propertyYear;
    delete opts.propertyWeekNumber;

    this.query = function(year, weekNumber) {
      opts.params[propYear]    = year;
      opts.params[propWeekNum] = weekNumber;
      return $http(opts)
        .then(function (response) {
          return response.data;
        });
    };
  };
  $inherit(ScheduleData.LoaderHttp, ScheduleDataLoader);

  ScheduleData.LoaderFacebook = function(opts) {
    ScheduleDataLoader.call(this, opts);
    opts        = opts || {};

    var
    _fbObjectId = opts.facebookObjectId || false,
    _fbAuthToken = opts.facebookAuthToken || false;

    function parseFacebookDate(date) {
      var
      fixedStr = date.replace('+0000','.000Z');
      return new Date(fixedStr);
    }

    this.isValid = function () {
      return !!_fbObjectId && !!_fbAuthToken;
    };

    this.setFacebookObject = function(fbObjectId, fbAuthToken) {
      _fbObjectId = fbObjectId;
      _fbAuthToken = fbAuthToken;
    };

    this.queryFacebookData = function(from, to) {
      return $fb.getObjectPosts({
        id: _fbObjectId,
        access_token: _fbAuthToken
      }, from, to, ['id', 'updated_time', 'created_time', 'status_type', 'type'])
        .then(function (results) {
          return results.data.map(function (post) { // facebook sends us weird dates, fix them:
            post.date = parseFacebookDate(post.created_time);
            return post;
          });
        });
    };

    this.queryFutureData = function(from, to) {
      return $http.get('/api/user-schedule/posts-pending', {
        params: {
          dateStart: from,
          dateEnd: to
        }
      }).then(function (results) {
        return results.data.map(function (result) {
          result.date = result.scheduledFor;
          return result;
        });
      });
    };

    this.query = function(year, weekNumber) {
      if(!this.isValid()) return $q.when(false);

      var
      dateRange      = $week.dateRange(year, weekNumber),
      now            = new Date,
      includesFuture = dateRange.end > now,
      includesPast   = dateRange.start < now;

      if(!includesFuture) { // historical only view
        return this.queryFacebookData(dateRange.start, dateRange.end);
      }
      else if(!includesPast) { // future only view
        return this.queryFutureData(dateRange.start, dateRange.end);
      }
      else { // aggregated view
        return this.queryFutureData(dateRange.start, dateRange.end)
          .then((function (futureData) {
            var aggregated = [];

            if(futureData) {
              Array.prototype.push.apply(aggregated, futureData);
            }

            return this.queryFacebookData(dateRange.start, dateRange.end)
              .then(function (facebookData) {
                Array.prototype.push.apply(aggregated, facebookData);
                return aggregated;
              });
          }).bind(this));
      }
    };
  };

  $inherit(ScheduleData.LoaderFacebook, ScheduleDataLoader);

  return ScheduleData;
})
.factory('SchedulePlan', function ($log, Time, DateShifter) {

  function SchedulePlan(segments, dates) {

    if(!angular.isArray(segments)) {
      segments = [];
    }

    if(!angular.isArray(dates)) {
      dates = [];
    }

    var
    maxdate, mindate,
    shifter = new DateShifter(),
    months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August','September','October','November','December'],
    monthAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug','Sept','Oct','Nov','Dec'];

    function reloadDates(d) { // maintains existing reference

      maxdate = 0;
      mindate = Infinity;

      // clear existing array:
      dates.splice(0, dates.length);

      d.forEach(function (dt) {
        var
        date = DateShifter.normalizeDate(dt),
        dateMs = date.getTime();

        maxdate = Math.max(maxdate, dateMs);
        mindate = Math.min(mindate, dateMs);

        dates.push(date);
      });

      // setup the shifter
      // shifter.minDate = mindate;
      // shifter.maxDate = mindate;
      shifter.defaultStep = 8.64e7 * dates.length;
    }

    function dateMs(d) {
      return DateShifter.normalizeDateMS(d);
    }

    this.getStartDate = function() {
      return new Date(mindate);
    };
    this.getEndDate = function() {
      return new Date(maxdate);
    };
    this.getMonthName = function() {
      var monthL  = this.getStartDate().getMonth(),
          monthH  = this.getEndDate().getMonth();

      if(monthL !== monthH) { // bridging months
        return monthAbbr[monthL] + ' - ' + months[monthH];
      }

      return months[monthH];
    };
    this.getWeekNumber = function(date) {
      date = date || maxdate;
      var d = new Date(+date);
      d.setHours(0,0,0);
      d.setDate(d.getDate()+4-(d.getDay()||7));
      return Math.ceil((((d-new Date(d.getFullYear(),0,1))/8.64e7)+1)/7);
    };
    this.getYear = function() {
      return this.getEndDate().getFullYear();
    };
    this.getDates = function() {
      return dates;
    };
    this.getSegments = function() {
      return segments;
    };
    this.shiftDate = function(date, dir, days) {
      var ms = dateMs(date);
      days = days || dates.length;
      dir  = dir  || 1;
      return new Date(ms + ((8.64e7 * (dir > 0 ? 1 : -1)) * days));
    };
    this.canShift = function(dir, boundDate) {
      if(!boundDate) return true;

      var bMs = boundDate,
      target = this.shiftDate((dir > 0 ? maxdate : mindate), dir);

      return (dir > 0) ? bMs >= target : bMs <= target;
    };
    this.shift = function(dir) {
      var shiftDate = this.shiftDate.bind(this);
      reloadDates(dates.map(function (dt, i, a) {
        return shiftDate(dt.getTime(), dir, a.length);
      }));
    };

    reloadDates(dates.slice(0, dates.length));
  }

  SchedulePlan.localWeekDates = function(bow, now) {
    bow = bow || 0;
    now = now || new Date();

    var
    ms  = 8.64e7,
    day = now.getDay(),
    offset = (day - bow) * ms;

    now.setHours(0, 0, 0, 0);

    if(offset > 0) {
      now.setTime(now.getTime() - offset);
    }
    else if(offset < 0) {
      now.setTime(now.getTime() - (-offset * 6));
    }

    var result = [];
    for(var i=0; i < 7; i++) {
      result.push(new Date(now.getTime() + (ms * i)));
    }

    return result;
  };

  return SchedulePlan;
});