'use strict';

angular.module('auditpagesApp')
  .controller('RedeemCtrl', function ($scope, $http, $stateParams, socket) {
    $scope.code = $stateParams.code;
  });
