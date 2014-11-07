'use strict';

angular.module('auditpagesApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('app.signup', {
        url: '/signup',
        views: {
          'content': {
            templateUrl: 'app/signup/signup.html',
            controller: 'SignupCtrl'
          }
        }
      });
  });
