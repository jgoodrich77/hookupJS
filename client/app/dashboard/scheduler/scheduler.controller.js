'use strict';

angular
.module('auditpagesApp')
.filter('dataEntryTooltip', function (Calendar, $filter) {
  var dateFn = $filter('date');
  return function (entries) {
    if(!entries || !entries.length) return null;
    return entries.map(function (entry) {
      return dateFn(entry.date, 'short');
    }).join('<br />');
  };
})
.filter('dataEntryCell', function (Calendar) {
  return function (entries, period) {
    var
    isCurrentPeriod = Calendar.isPast(period.from) && Calendar.isFuture(period.to),
    hasData         = (!!entries && !!entries.length);

    if(!hasData && !isCurrentPeriod) return '&nbsp;';
    if(!hasData && isCurrentPeriod)  return '<span class="glyphicon glyphicon-plus"></span>';

    return entries.length;
  };
})
.controller('DashboardSchedulerCtrl', function ($q, $scope, $fb, $filter, $state, $interval, $numberUtil, Calendar, DayGroup, Day, TimeRange, DateStore, ScheduleDataAggr) {

  var
  BOW      = 0,
  calendar = $scope.calendar = new Calendar(BOW),
  data     = $scope.data     = new DateStore(),
  daySpec  = [
    new DayGroup('Morning',   new TimeRange('00:00', '11:59:59.999'), 3),
    new DayGroup('Afternoon', new TimeRange('12:00', '17:59:59.999'), 3),
    new DayGroup('Evening',   new TimeRange('18:00', '23:59:59.999'), 3)
  ];

  $scope.weekDays = [];
  $scope.modelOpts = {
    debounce: 250
  };

  $scope.headerClasses = function(item) {
    var
    classes = {};

    if(calendar.isToday(item.date.date)) {
      classes['today'] = true;
    }

    return classes;
  };

  $scope.itemClasses = function (period) {
    if(!data) return;

    var
    records     = data.queryDateRange(period),
    hasData     = !!records.length,
    heatMap     = $numberUtil.clamp(records.length, 0, 4, 0),
    isStartPast = Calendar.isPast(period.from),
    isEndPast   = Calendar.isPast(period.to),
    isToday     = calendar.isToday(period.from) && calendar.isToday(period.to),
    classes     = {};

    if(isToday) {
      classes['today'] = true;
    }

    classes['heatmap-' + heatMap] = true;

    if(!hasData) {
      if(isStartPast && !isEndPast) classes['present'] = true;
      else if(!isStartPast)         classes['future']  = true;
      else if(isEndPast)            classes['past']    = true;
    }

    return classes;
  };

  $scope.explainScore = function (result) {
    $scope.explaining = true;
    $scope.explainedScore = result;
  };

  $scope.itemClick = function(period) {

    var
    records = data.queryDateRange(period),
    hasData = !!records.length,
    dateFmt = $filter('date'),
    params  = {
      date:        dateFmt(period.from, 'yyyy-MM-dd'),
      periodStart: dateFmt(period.from, 'HH:mm'),
      periodEnd:   dateFmt(period.to, 'HH:mm:ss.sss')
    };

    if(hasData) {
      $state.go('app.dashboard.view-posts', params);
    }
    else if(!Calendar.isPast(period.to)) {
      $state.go('app.dashboard.create-post', params);
    }
  };

  var
  lObject, lToken,
  lFromDate, lToDate;

  function reloadData () {
    if(!lObject || !lToken) return false;

    $scope.reloadingData = true;
    $scope.loader = new ScheduleDataAggr(lObject, lToken);
    return $scope.loader.load(calendar.dateRange)
      .then(function (results) {
        data.clearRecords();
        data.addRecords(results);
        return data;
      })
      .finally(function () {
        $scope.reloadingData = false;
      });
  }

  function reloadObject () {
    if($scope.reloadingObject) return false;

    $scope.reloadingObject = true;

    return $fb.whenReady()
      .then(function(){
        return $fb.getObjectIdToken(lObject);
      })
      .then(function (token) {
        if(!token) {
          $scope.fbObjectError  = 'No token could be found for page.';
          return;
        }

        lToken = token;

        return {
          object: lObject,
          token: lToken
        };
      })
      .finally(function () {
        $scope.reloadingObject = false;
      });
  }

  function rebuildCalendar () {
    $scope.weekDays.splice(0, $scope.weekDays.length);

    calendar.weekDates.forEach(function (d) {
      var day = new Day(daySpec);
      $scope.weekDays.push({
        day: day,
        date: day.applyDate(d)
      });
    });
  }

  $scope.reload = function (force) {
    if(!calendar || !data || !$scope.currentFbObject) return;

    var
    cRange       = calendar.dateRange,
    cFbObj       = $scope.currentFbObject,
    changeDates  = (lFromDate !== cRange.from || lToDate !== cRange.to),
    changeObject = (lObject !== cFbObj.id || !lToken);

    if (changeDates) {
      lFromDate = cRange.from;
      lToDate   = cRange.to;
      rebuildCalendar();
    }

    var
    promise = false;

    if (changeObject) {
      lObject = cFbObj.id;
      lToken  = null;
      promise = reloadObject();
    }

    if(changeDates || changeObject || !!force) {
      promise = !!promise ? promise.then (reloadData) : reloadData ();
    }

    return promise;
  };

  $interval(function(){}, 1000); // refresh the scope
  $scope.$watch('calendar.week', $scope.reload);
  $scope.$watch('calendar.year', $scope.reload);

  if(!$scope.fullLoading) {
    $scope.reload();
  }

  $scope.$on('dashboard-reload', function (evt, currentObject, currentScore) {
    $scope.reload();
  });
});