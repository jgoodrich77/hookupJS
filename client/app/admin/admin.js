'use strict';

angular.module('auditpagesApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('app.admin', {
        url: '/admin',
        templateUrl: 'app/admin/admin.html',
        controller: 'AdminCtrl'
      });
  });
