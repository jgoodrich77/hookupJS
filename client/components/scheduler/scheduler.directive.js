'use strict';

angular
.module('auditpagesApp')
.directive('scheduler', function ($log, $padLeft, Time) {
  return {
    restrict: 'E',
    templateUrl: 'components/scheduler/scheduler.html',
    scope: {
      calendar: '=',
      datasource: '=',
      doItemClick: '=',
      doItemClasses: '='
    },
    link: function (scope, el, attrs) {
      scope.util = {
        isToday: function (date) {
          return Time.isSameDay(date, new Date);
        }
      };
    }
  };
});