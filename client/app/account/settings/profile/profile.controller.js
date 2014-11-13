'use strict';

angular
.module('auditpagesApp')
.controller('AccountSettingsProfileCtrl', function ($scope, $user) {
  $scope.loading = false;
  $scope.loadErr = false;
  $scope.saving  = false;
  $scope.saveErr = false;

  $scope.save = function () {
  };
  $scope.reset = function (loadDeps) {
  };
});
