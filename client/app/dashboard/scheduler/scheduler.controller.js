'use strict';

angular
.module('auditpagesApp')
.controller('DashboardSchedulerCtrl', function ($scope, $fb, $filter, $state, $interval, Time, ScheduleDataAggr, CalendarWeek) {
  /*Scheduler, ScheduleData, SchedulePlan,*/
  var
  calendar = $scope.calendar = new CalendarWeek(0, null, null, [
    { group: 'morning',   start: '00:00:00.000', end: '04:59:59.999' },
    { group: 'morning',   start: '05:00:00.000', end: '07:59:59.999' },
    { group: 'morning',   start: '08:00:00.000', end: '09:59:59.999' },
    { group: 'afternoon', start: '10:00:00.000', end: '11:59:59.999' },
    { group: 'afternoon', start: '12:00:00.000', end: '14:59:59.999' },
    { group: 'afternoon', start: '15:00:00.000', end: '16:59:59.999' },
    { group: 'evening',   start: '17:00:00.000', end: '18:59:59.999' },
    { group: 'evening',   start: '19:00:00.000', end: '20:59:59.999' },
    { group: 'evening',   start: '21:00:00.000', end: '23:59:59.999' }
  ]);

  function loadDataAndObject(currentObject) {
    if($scope.loadingScheduler) return; // prevent repeated calls

    currentObject = currentObject || $scope.currentFbObject;

    if(!currentObject || !currentObject.id) {
      return;
    }

    $scope.loadError        = false;
    $scope.loadingScheduler = true;

    return $fb.whenReady()
      .then(function(){
        return $fb.getObjectIdToken(currentObject.id);
      })
      .then(function (token) {
        if(!token) {
          $scope.fbObjectError  = 'No token could be found for page.';
          return;
        }
        $scope.loader = new ScheduleDataAggr($scope.calendar, currentObject.id, token);
        return $scope.reloadData();
      })
      .catch(function(err){
        console.log('got error', err);
        $scope.loadError = err;
      })
      .finally(function () {
        $scope.loadingScheduler = false;
      });
  }

  if(!$scope.fullLoading) {
    loadDataAndObject();
  }

  $scope.$on('dashboard-reload', function (evt, currentObject, currentScore) {
    loadDataAndObject(currentObject);
  });
  $scope.$on('dashboard-reload-error', function (err) {
    console.log('dashboard-reload-error', err);
  });

  $scope.shiftWeek = function(dir) {
    $scope.calendar.shiftWeek(dir);
    return $scope.reloadData();
  };

  $scope.canShiftWeek = function(dir) {
    return true;
  };

  $scope.reloadData = function () {
    if(!$scope.loader) return false;
    return $scope.loader.load('date');
  };

  $interval(function(){}, 2500); // so scope updates on time changes

  $scope.itemClasses = function(period, date, records) {
    var
    isSameDay     = Time.isSameDay(date),
    isPastEnd     = Time.isPast(period.end),
    isFutureStart = Time.isFuture(period.start),
    hasRecords    = !!records && !!records.length;

    return {
      'current':  isSameDay,
      'disabled': false,
      'negative': isPastEnd && !hasRecords,
      'positive': hasRecords,
      'neutral':  isFutureStart
    };
  };

  $scope.explainScore = function (result) {
    $scope.explaining = true;
    $scope.explainedScore = result;
  };

  $scope.itemClick = function(period, date, records) {
    var
    isSameDay     = Time.isSameDay(date),
    isPastEnd     = Time.isPast(period.end),
    isFutureStart = Time.isFuture(period.start),
    hasRecords    = !!records && !!records.length,

    dateFmt    = $filter('date'),
    params     = {
      date:        dateFmt(date, 'yyyy-MM-dd'),
      periodStart: Time.parse(period.start).toString(),
      periodEnd:   Time.parse(period.end).toString()
    };

    if(hasRecords) {
      $state.go('app.dashboard.view-posts', params);
    }
    else if(!isPastEnd) {
      $state.go('app.dashboard.create-post', params);
    }
  };
});
