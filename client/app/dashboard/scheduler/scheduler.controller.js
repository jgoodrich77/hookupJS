'use strict';

angular
.module('auditpagesApp')
.controller('DashboardSchedulerCtrl', function ($scope, $fb, $filter, $state, $interval, Time, Scheduler, ScheduleData, SchedulePlan) {

  var
  dates = SchedulePlan.localWeekDates(0),
  dateLen = dates.length,
  objectId, accessToken,
  plan = new SchedulePlan([
      { name: 'Morning', periods: [
        { start: '00:00', end: '04:59:59.999' },
        { start: '05:00', end: '07:59:59.999' },
        { start: '08:00', end: '09:59:59.999' }
      ] },
      { name: 'Afternoon', periods: [
        { start: '10:00', end: '11:59:59.999' },
        { start: '12:00', end: '14:59:59.999' },
        { start: '15:00', end: '16:59:59.999' }
      ] },
      { name: 'Evening', periods: [
        { start: '17:00', end: '18:59:59.999' },
        { start: '19:00', end: '20:59:59.999' },
        { start: '21:00', end: '23:59:59.999' }
      ] }
    ], dates),
  facebookLoader = new ScheduleData.LoaderFacebook(),
  data = new ScheduleData(plan, {
    rowDateProperty: 'date',
    loader: facebookLoader
  });

  $scope.scheduler = new Scheduler(plan, data, {
    minDate: new Date(new Date(dates[0]).getTime() - (8.64e7 * dateLen * 8)),
    maxDate: new Date(new Date(dates[dateLen - 1]).getTime() + (8.64e7 * dateLen)),
    autoLoad: false
  });

  var
  loadingData = false;

  function loadData() {
    if(loadingData) return loadingData; // prevent repeated calls

    data.reset();
    return loadingData = data.reload()
      .finally(function(){
        loadingData = false;
      });
  }

  function loadDataAndObject(currentObject) {
    if($scope.loadingScheduler) return; // prevent repeated calls

    $scope.loadingScheduler = true;

    currentObject = currentObject || $scope.currentFbObject;
    return $fb.getObjectIdToken(currentObject.id)
      .then(function (token) {
        if(!token) {
          $scope.fbObjectError  = 'No token could be found for page.';
          return;
        }

        facebookLoader.setFacebookObject(currentObject.id, token);

        return loadData();
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

  $interval(function(){}, 2500); // so scope updates on time changes

  $scope.itemClasses = function(period, date, records) {
    var
    now = new Date,
    pStartDate = Time.parse(period.start).toDate(date),
    pEndDate   = Time.parse(period.end).toDate(date),
    isSameDay  = Time.isSameDay(date, now);

    return {
      'current':  isSameDay,
      'disabled': false,
      'negative': Time.isPast(pEndDate, now) && !records.length,
      'positive': !!records.length,
      'neutral':  Time.isFuture(pStartDate, now)
    };
  };

  $scope.explainScore = function (result) {
    $scope.explaining = true;
    $scope.explainedScore = result;
  };

  $scope.itemClick = function(period, date, records) {

    var
    pStartDate = Time.parse(period.start).toDate(date),
    pEndDate   = Time.parse(period.end).toDate(date),
    dateFmt    = $filter('date'),
    params     = {
      date:        dateFmt(date, 'yyyy-MM-dd'),
      periodStart: period.start,
      periodEnd:   period.end
    };

    if(Time.isFuture(pEndDate, new Date)) {
      $state.go('app.dashboard.create-post', params);
    }
    else if(records.length > 0) {
      $state.go('app.dashboard.view-posts', params);
    }
  };
});
