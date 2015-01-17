'use strict';

angular
.module('auditpagesApp')
.controller('MainCtrl', function ($scope, $auth) {
  $scope.isConnected = $auth.hasAccessToken.bind($auth);
});