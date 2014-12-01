'use strict';

angular.module('auditpagesApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('app.get-started', {
        url: '/get-started',
        data: {
          breadcrumbTitle: 'Getting Started'
        },
        views: {
          'content': {
            templateUrl: 'app/get-started/get-started.html',
            controller: 'GetStartedCtrl'
          }
        }
      });
  });
