'use strict';

angular.module('auditpagesApp')
  .controller('LoginCtrl', function ($scope, $state, $rootScope, Auth, $location, $window) {
    $scope.user = {};
    $scope.errors = {};

    $scope.debugSetCredentials = function(username, password) {
      $scope.user.email = username;
      $scope.user.password = password;
    };

    $scope.login = function(form) {
      $scope.submitted = true;

      if(form.$valid) {
        Auth.login({
          email: $scope.user.email,
          password: $scope.user.password
        })
        .then( function() {
          if($rootScope.returnToState) {
            $state.transitionTo($rootScope.returnToState.name, $rootScope.returnToStateParams);
          }
          else {
            $state.transitionTo('app.main');
          }
        })
        .catch( function(err) {
          $scope.errors.other = err.message;
        });
      }
    };

    $scope.loginOauth = function(provider) {
      $window.location.href = '/auth/' + provider;
    };
  });
