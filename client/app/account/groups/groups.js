'use strict';

angular.module('auditpagesApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('app.account.groups', {
        url: '/groups',
        data: {
          breadcrumbTitle: 'My Groups'
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
        url: '/update/:id',
        data: {
          breadcrumbTitle: 'Update "{{group.name}}"'
        },
        views: {
          'account-group-content': {
            templateUrl: 'app/account/groups/update/update.html',
            controller: 'AccountGroupsUpdateCtrl'
          }
        },
        resolve: {
          group: function($stateParams, Group) {
            return Group.detailedInfoSubscribed($stateParams).$promise;
          }
        }
      })
      .state('app.account.groups.servicecfg', {
        url: '/service-config/:id',
        data: {
          breadcrumbTitle: 'Service configs for "{{group.name}}"'
        },
        views: {
          'account-group-content': {
            templateUrl: 'app/account/groups/servicecfg/servicecfg.html',
            controller: 'AccountGroupsServiceCfgCtrl'
          }
        },
        resolve: {
          group: function($stateParams, Group) {
            return Group.basicInfoSubscribed($stateParams).$promise;
          }
        }
      })
      .state('app.account.groups.stats', {
        url: '/stats/:id',
        data: {
          breadcrumbTitle: 'Stats for "{{group.name}}"'
        },
        views: {
          'account-group-content': {
            templateUrl: 'app/account/groups/stats/stats.html',
            controller: 'AccountGroupsStatsCtrl'
          }
        },
        resolve: {
          group: function($stateParams, Group) {
            return Group.basicInfoSubscribed($stateParams).$promise;
          }
        }
      })
      .state('app.account.groups.members', {
        url: '/members/:id',
        data: {
          breadcrumbTitle: 'Members in "{{group.name}}"'
        },
        views: {
          'account-group-content': {
            templateUrl: 'app/account/groups/members/members.html',
            controller: 'AccountGroupsMembersCtrl'
          }
        },
        resolve: {
          group: function($stateParams, Group) {
            return Group.basicInfoSubscribed($stateParams).$promise;
          }
        }
      });
  });
