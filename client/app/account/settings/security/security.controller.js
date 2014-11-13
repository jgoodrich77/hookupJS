'use strict';

angular.module('auditpagesApp')
  .controller('AccountSettingsSecurityCtrl', function ($scope, User, Auth) {
    $scope.submitErr = false;

    $scope.reset = function() {
      $scope.passwordChange = {};
    };

    $scope.changePassword = function(form) {
      $scope.submitting = true;
      if(form.$valid) {
        Auth.changePassword (
          $scope.passwordChange.oldPassword,
          $scope.passwordChange.newPassword
        )
        .then( function() {
          $scope.message = 'Password successfully changed.';
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
