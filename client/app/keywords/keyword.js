'use strict';

angular.module('auditpagesApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('keywords', {
        url: '/keywords',
        templateUrl: 'app/keywords/keywords.html',
        controller: 'KeywordCtrl',
	authenticate: true
      });
  });
