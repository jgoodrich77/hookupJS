'use strict';

angular.module('auditpagesApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('app.keywords', {
        url: '/keywords',
	authenticate: true,
        views: {
          'content': {
            templateUrl: 'app/keywords/keywords.html',
            controller: 'KeywordCtrl',
          }
        }
      });
  });
