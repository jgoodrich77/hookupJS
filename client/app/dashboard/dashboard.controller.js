'use strict';

angular
.module('auditpagesApp')
.controller('DashboardCtrl', function ($scope, $fb, Scheduler, ScheduleData, SchedulePlan) {

  var
  dates = SchedulePlan.localWeekDates(0),
  dateLen = dates.length,
  plan = new SchedulePlan([
      { name: 'Morning', periods: [
        { start: '05:00', end: '07:59:59.999' },
        { start: '08:00', end: '09:59:59.999' },
        { start: '10:00', end: '11:59:59.999' }
      ] },
      { name: 'Afternoon', periods: [
        { start: '12:00', end: '14:59:59.999' },
        { start: '15:00', end: '16:59:59.999' },
        { start: '17:00', end: '18:59:59.999' }
      ] },
      { name: 'Evening', periods: [
        { start: '19:00', end: '20:59:59.999' },
        { start: '21:00', end: '23:59:59.999' },
        { start: '00:00', end: '04:59:59.999' }
      ] }
    ], dates),
  data = new ScheduleData(plan, {
    loader: new ScheduleData.LoaderRandom({
      simulateLoad: true,
      simulateLoadTime: 250
    })
  });

  $scope.scheduler = new Scheduler(plan, data, {
    minDate: new Date(new Date(dates[0]).getTime() - (8.64e7 * dateLen * 8)),
    maxDate: new Date(new Date(dates[dateLen - 1]).getTime() + (8.64e7 * dateLen)),
    autoLoad: true
  });
});
