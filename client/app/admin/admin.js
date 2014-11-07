'use strict';

angular.module('auditpagesApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('app.admin', {
        url: '/admin',
        data: {
          roles: ['admin'],
          breadcrumbTitle: 'Administration Panel'
        },
        views: {
          'content': {
            templateUrl: 'app/admin/admin.html'
          }
        }
      })
      .state('app.admin.users', {
        url: '/users',
        data: {
          breadcrumbTitle: 'User Administration'
        },
        views: {
          'admin-content': {
            templateUrl: 'app/admin/users/users.html',
            controller: 'AdminUsersCtrl'
          }
        }
      });
  });
