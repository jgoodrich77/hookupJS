'use strict';

angular.module('auditpagesApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('app.login', {
        url: '/login',
        views: {
          'content': {
            templateUrl: 'app/login/login.html',
            controller: 'LoginCtrl'
          }
        }
      });
  });
