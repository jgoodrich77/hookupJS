'use strict';

angular
.module('auditpagesApp')
.controller('MainCtrl', function ($scope, $auth, $location, $anchorScroll) {
  $scope.isConnected = $auth.hasAccessToken.bind($auth);

  $scope.gotoTour = function() {
    $location.hash('tour');
    $anchorScroll();
  };
});