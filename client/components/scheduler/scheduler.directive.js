'use strict';

angular
.module('auditpagesApp')
.directive('scheduler', function ($log, $padLeft, Time) {
  return {
    restrict: 'A',
    templateUrl: 'components/scheduler/scheduler.html',
    link: function (scope, el, attrs) {

      scope.util = {
        isToday: function(date) {
          var
          now = new Date(),
          d   = new Date(date);

          return (d.getFullYear() === now.getFullYear()) &&
                 (d.getMonth()    === now.getMonth()) &&
                 (d.getDate()     === now.getDate());
        },
        isDisabled: function(period, date) {
          return scope.data.getRecord(period, date) === 1;
        },
        isNegative: function(period, date) {
          return scope.data.getRecord(period, date) === 2;
        },
        isNeutral: function(period, date) {
          return scope.data.getRecord(period, date) === 3;
        },
        isPositive: function(period, date) {
          return scope.data.getRecord(period, date) >=  4;
        },
        getPeriodTitle: function(period) {
          var
          sT = Time.parse(period.start),
          eT = Time.parse(period.end);

          return sT.get12Hr() + ' - ' + eT.get12Hr();
        },
        getItemClasses: function(period, date) {
          return {
            'current':  this.isToday(date),
            'disabled': this.isDisabled(period, date),
            'negative': this.isNegative(period, date),
            'positive': this.isPositive(period, date),
            'neutral':  this.isNeutral(period, date)
          };
        }
      };

      function loadScheduler(v) {
        scope.data = {};
        if(!v) return;

        var
        sPlan = v.getPlan(),
        sData = v.getData();

        scope.data.segments   = sPlan.getSegments();
        scope.data.dates      = sPlan.getDates();
        scope.data.weekNumber = sPlan.getWeekNumber.bind(sPlan);
        scope.data.month      = sPlan.getMonthName.bind(sPlan);
        scope.data.year       = sPlan.getYear.bind(sPlan);
        scope.data.getRecord  = sData.getRecord.bind(sData);
        scope.data.isLoading  = sData.isLoading.bind(sData);
      }

      scope.$watch(attrs.scheduler, loadScheduler);
    }
  };
});