'use strict';

angular.module('auditpagesApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('app.listkeywords', {
        url: '/listkeywords',
	authenticate: true,
        views: {
          'content': {
            templateUrl: 'app/listkeywords/listkeywords.html',
            controller: 'ListkeywordCtrl',
          }
        }
      });
  });
