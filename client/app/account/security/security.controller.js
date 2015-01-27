'use strict';

angular.module('auditpagesApp')
  .controller('AccountSecurityCtrl', function ($scope, $user, User, Auth) {
    $scope.submitErr = false;

    $scope.reset = function() {
      $scope.passwordChange = {};
      $scope.submitErr = null;
      $scope.message = null;
    };

    $scope.changePassword = function(form) {
      $scope.submitting = true;
      $scope.submitErr = null;
      $scope.message = null;

      if(form.$valid) {
        $user.changePassword({
          oldPassword: $scope.passwordChange.oldPassword,
          newPassword: $scope.passwordChange.newPassword
        })
        .then( function() {
          $scope.message = 'Password successfully changed.';
          $scope.passwordChange = {};
        })
        .catch( function() {
          form.password.$setValidity('mongoose', false);

          $scope.submitErr = {
            other: 'Incorrect password'
          };
          $scope.message = '';
        })
        .finally(function() {
          $scope.submitting = false;
        });
      }
      else {
        $scope.submitting = false;
      }
    };
  });
