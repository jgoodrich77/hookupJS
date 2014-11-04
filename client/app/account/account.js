'use strict';

angular.module('auditpagesApp')
  .config(function ($stateProvider) {
    $stateProvider
     
      .state('app.keyword', {
        url: '/keyword',
        views: {
          'content': {
            templateUrl: 'app/account/keyword/keyword.html',
            controller: 'AccountKeywordsCtrl'
          }
        }
      })
 
      .state('app.account.settings', {
        url: '/settings',
        authenticate: true,
        views: {
          'content': {
            templateUrl: 'app/account/settings/settings.html',
            controller: 'SettingsCtrl' // rename to AccountSettingsCtrl
          }
        }
      })
      .state('app.login', {
        url: '/login',
        views: {
          'content': {
            templateUrl: 'app/account/login/login.html',
            controller: 'LoginCtrl'
          }
        }
      })
      .state('app.signup', {
        url: '/signup',
        views: {
          'content': {
            templateUrl: 'app/account/signup/signup.html',
            controller: 'SignupCtrl'
          }
        }
      });
      
  });
