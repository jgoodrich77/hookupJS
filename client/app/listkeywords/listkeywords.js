'use strict';

angular.module('auditpagesApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('app.listkeywords', {
        url: '/listkeywords',
        views: {
          'content': {
            templateUrl: 'app/listkeywords/listkeywords.html',
            controller: 'MainCtrl'
          }
        }
      });
  });
