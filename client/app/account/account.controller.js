'use strict';

angular.module('auditpagesApp')
  .controller('AccountCtrl', function ($scope, $state) {

    $scope.isAccountHome = function() {
      if(!$state.current) return;
      return $state.current.name === 'app.account';
    };

  });
