'use strict';

angular.module('auditpagesApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('app.group', {
        url: '/group',
        views: {
          'content': {
            templateUrl: 'app/group/group.html',
            controller: 'GroupCtrl'
          }
        }
      })
      .state('app.group.services', {
        url: '/services',
        views: {
          'content': {
            templateUrl: 'app/group/service/service.html',
            controller: 'GroupServiceCtrl'
          }
        }
      });
  });
