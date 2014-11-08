'use strict';

angular.module('auditpagesApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('app.account.groups', {
        url: '/groups',
        data: {
          breadcrumbTitle: 'Groups'
        },
        views: {
          'account-content': {
            templateUrl: 'app/account/groups/groups.html',
            controller: 'AccountGroupsCtrl'
          }
        }
      })
      .state('app.account.groups.create', {
        url: '/new',
        data: {
          breadcrumbTitle: 'Create New'
        },
        views: {
          'account-group-content': {
            templateUrl: 'app/account/groups/create/create.html',
            controller: 'AccountGroupsCreateCtrl'
          }
        }
      })
      .state('app.account.groups.update', {
        url: '/update',
        data: {
          breadcrumbTitle: 'Update Existing'
        },
        views: {
          'account-group-content': {
            templateUrl: 'app/account/groups/update/update.html',
            controller: 'AccountGroupsUpdateCtrl'
          }
        }
      });
  });
