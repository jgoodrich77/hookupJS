'use strict';

angular.module('auditpagesApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('app.account.settings', {
        url: '/settings',
        data: {
          breadcrumbTitle: 'My Settings'
        },
        views: {
          'account-content': {
            templateUrl: 'app/account/settings/settings.html',
            controller: 'AccountSettingsCtrl'
          }
        }
      })
      .state('app.account.settings.profile', {
        url: '/profile',
        data: {
          breadcrumbTitle: 'Profile'
        },
        views: {
          'account-settings-content': {
            templateUrl: 'app/account/settings/profile/profile.html',
            controller: 'AccountSettingsProfileCtrl'
          }
        }
      })
      .state('app.account.settings.security', {
        url: '/security',
        data: {
          breadcrumbTitle: 'Security'
        },
        views: {
          'account-settings-content': {
            templateUrl: 'app/account/settings/security/security.html',
            controller: 'AccountSettingsSecurityCtrl'
          }
        }
      });
  });
