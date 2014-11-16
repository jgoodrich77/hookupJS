'use strict';

angular.module('auditpagesApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('app.redeem', {
        url: '/redeem-invite/:code',
        data: {
          breadcrumbTitle: 'Redeem'
        },
        views: {
          'content': {
            templateUrl: 'app/redeem/redeem.html',
            controller: 'RedeemCtrl'
          }
        }
      });
  });
