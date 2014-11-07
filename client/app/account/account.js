'use strict';

angular.module('auditpagesApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('app.account', {
        'abstract': true,
        url: '/account',
        data: {
          roles: ['admin', 'user']
        },
        views: {
          'content': {
            templateUrl: 'app/account/account.html'
          }
        }
      })
      .state('app.account.settings', {
        url: '/settings',
        authenticate: true,
        views: {
          'account-content': {
            templateUrl: 'app/account/settings/settings.html',
            controller: 'AccountSettingsCtrl'
          }
        }
      })
      .state('app.login', {
        url: '/login',
        views: {
          'content': {
            templateUrl: 'app/account/login/login.html',
            controller: 'LoginCtrl'
          }
        }
      })
      .state('app.signup', {
        url: '/signup',
        views: {
          'content': {
            templateUrl: 'app/account/signup/signup.html',
            controller: 'SignupCtrl'
          }
        }
      });
  });
