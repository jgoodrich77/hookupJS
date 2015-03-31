angular
.module('MyApplication', ['angular-calendar'])
.controller('IndexCtrl', ['$scope', '$log', 'Calendar', 'CalendarVersion', function ($scope, $log, Calendar, CalendarVersion) {

  var beginningOfWeek = 0; // sunday

  $scope.testOffsetMultiplier = 'week';
  $scope.testOffset = -5;

  ($scope.resetCurrentDate = function(){
    $scope.currentDate = new Date();
  })();

  $scope.calendar = new Calendar(beginningOfWeek);

  $log.debug('Calendar Version:', CalendarVersion);
}]);