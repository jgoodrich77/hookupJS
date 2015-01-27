'use strict';

angular.module('auditpagesApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('app.meme', {
        url: '/meme',
        data: {
          breadcrumbTitle: 'Meme Generator'
        },
        views: {
          'content': {
            templateUrl: 'app/meme/meme.html',
            controller: 'MemeCtrl'
          }
        }
      });
  });
