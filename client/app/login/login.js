'use strict';

angular.module('auditpagesApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('app.login', {
        url: '/login',
        data: {
          breadcrumbTitle: 'Account Login'
        },
        views: {
          'content': {
            templateUrl: 'app/login/login.html',
            controller: 'LoginCtrl'
          }
        }
      });
  });
