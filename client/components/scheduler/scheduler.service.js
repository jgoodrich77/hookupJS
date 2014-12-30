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
.factory('ScheduleData', function ($log, $q, $timeout, $http, $inherit, Time, CacheMemory) {

  function ScheduleDataLoader(opts) {
    var loading = false;
    this.isLoading = function() {
      return loading;
    };
    this.query = function(year, weekNumber) { // should be implemented by child class
      return [];
    };
    this.load = function(year, weekNumber) {
      loading = true;
      return $q.when(this.query(year, weekNumber))
        .finally(function(){
          loading = false;
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
              $log.warn('No bucket match for data', entry);
            }
          });

          return data;
        });
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

    this.query = function(year, weekNumber) { // should be implemented by child class
      opts.params[propYear]    = year;
      opts.params[propWeekNum] = weekNumber;
      return $http(opts)
        .then(function (response) {
          return response.data;
        });
    };
  };
  $inherit(ScheduleData.LoaderHttp, ScheduleDataLoader);

  ScheduleData.LoaderRandom = function(opts) {
    ScheduleDataLoader.call(this, opts);

    var
    simulateLoad = !!opts.simulateLoad,
    simulateLoadTime = opts.simulateLoadTime || 2500;

    this.query = function(year, weekNumber) { // should be implemented by child class
      var rnow = (new Date()).getTime();
      var now = new Date(year, 0, 1);

      now.setHours(0,0,0);
      now.setDate(now.getDate()+boW-(now.getDay()||7));
      now.setTime(now.getTime() + (8.64e7 * 7 * (weekNumber - 1)));

      var data = [];

      for(var day = 0; day < 7; day++) {
        var
        rRowCnt = Math.ceil((Math.random() * 50) + 1),
        dayDate = new Date(now.getTime() + (day * 8.64e7));

        for(var rowNum = 0; rowNum < rRowCnt; rowNum++) {
          var randMsInc = Math.ceil((Math.random() * 8.64e7) + 1);

          if((dayDate.getTime() + randMsInc) > rnow) continue;

          data.push({
            date: new Date(dayDate.getTime() + randMsInc),
            data: {}
          });
        }
      }

      if(!simulateLoad) {
        return data;
      }

      var
      defer = $q.defer();

      $timeout(function() {
        defer.resolve(data);
      }, simulateLoadTime);

      return defer.promise;
    };
  };
  $inherit(ScheduleData.LoaderRandom, ScheduleDataLoader);

  return ScheduleData;
})
.factory('SchedulePlan', function ($log, Time) {

  function SchedulePlan(segments, dates) {

    if(!angular.isArray(segments)) {
      segments = [];
    }

    if(!angular.isArray(dates)) {
      dates = [];
    }

    var
    maxdate, mindate,
    months    = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August','September','October','November','December'],
    monthAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug','Sept','Oct','Nov','Dec'];

    function reloadDates(d) { // maintains existing reference

      maxdate = 0;
      mindate = Infinity;

      // clear existing array:
      dates.splice(0, dates.length);

      d.forEach(function (dt) {

        if(!dt instanceof Date) {
          var parsed = Date.parse(dt);
          if(!parsed) return false;
          dt = new Date(parsed);
        }

        maxdate = Math.max(maxdate, dt.getTime());
        mindate = Math.min(mindate, dt.getTime());

        dates.push(dt);
      });
    }

    function dateMs(d) {
      return (d instanceof Date)
        ? d.getTime()
        : (angular.isNumber(d)
           ? d
           : Date.parse(d));
    }

    this.getStartDate = function() {
      return new Date(mindate);
    };
    this.getEndDate = function() {
      return new Date(maxdate);
    };
    this.getMonthName = function() {
      var monthL  = (new Date(mindate)).getMonth(),
          monthH  = (new Date(maxdate)).getMonth();

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
      return (new Date(maxdate)).getFullYear();
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
      var bMs = dateMs(boundDate),
      target = this.shiftDate((dir > 0 ? maxdate : mindate), dir).getTime();
      return (dir > 0) ? bMs >=target : bMs <=target;
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