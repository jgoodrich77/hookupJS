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
      });
  });
