'use strict';

angular.module('auditpagesApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('app.dashboard', {
        url: '/dashboard',
        data: {
          breadcrumbTitle: 'My Dashboard',
          roles: ['user']
        },
        views: {
          'content': {
            templateUrl: 'app/dashboard/dashboard.html',
            controller: 'DashboardCtrl'
          }
        }
      });
  });
