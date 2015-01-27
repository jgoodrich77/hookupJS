'use strict';

angular.module('auditpagesApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('app.account', {
        url: '/account',
        data: {
          roles: ['admin', 'user'],
          breadcrumbTitle: 'My Account'
        },
        views: {
          'content': {
            templateUrl: 'app/account/account.html',
            controller: 'AccountCtrl'
          }
        }
      })
      // .state('app.account.profile', {
      //   url: '/profile',
      //   data: {
      //     breadcrumbTitle: 'Profile'
      //   },
      //   views: {
      //     'account-content': {
      //       templateUrl: 'app/account/profile/profile.html',
      //       controller: 'AccountProfileCtrl'
      //     }
      //   }
      // })
      .state('app.account.security', {
        url: '/security',
        data: {
          breadcrumbTitle: 'Security'
        },
        views: {
          'account-content': {
            templateUrl: 'app/account/security/security.html',
            controller: 'AccountSecurityCtrl'
          }
        }
      });
  });
