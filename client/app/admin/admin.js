'use strict';

angular.module('auditpagesApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('app.admin', {
        'abstract': true,
        url: '/admin',
        data: {
          roles: ['admin']
        },
        views: {
          'content': {
            templateUrl: 'app/admin/admin.html'
          }
        }
      })
      .state('app.admin.users', {
        url: '/users',
        views: {
          'admin-content': {
            templateUrl: 'app/admin/users/users.html',
            controller: 'AdminUsersCtrl'
          }
        }
      });
  });
