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
            templateUrl: 'app/account/account.html'
          }
        }
      });
  });
