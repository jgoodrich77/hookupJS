'use strict';

angular.module('auditpagesApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'btford.socket-io',
  'ui.router',
  'ui.bootstrap'
])
.config(function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {
  $urlRouterProvider
    .otherwise('/');

  // abstract state for all others to iniherit
  $stateProvider
    .state('app', {
      'abstract': true ,
      templateUrl: 'app/app.layout.html',
      resolve: {
        authorize: ['Authorizer', function (Authorizer) {
          console.log('resolving auth state');
          return Authorizer.authorize()
            .then(function (output) {
              console.log('resolved authorize result:', output);
              return output;
            });
        }]
      }
    });

  $locationProvider.html5Mode(true);
  $httpProvider.interceptors.push('authInterceptor');
})

.factory('authInterceptor', function ($rootScope, $q, $cookieStore, $location) {
  return {
    // Add authorization token to headers
    request: function (config) {
      config.headers = config.headers || {};
      if ($cookieStore.get('token')) {
        config.headers.Authorization = 'Bearer ' + $cookieStore.get('token');
      }
      return config;
    },

    // Intercept 401s and redirect you to login
    responseError: function(response) {
      if(response.status === 401) {
        $location.path('/login');
        $cookieStore.remove('token');
        return $q.reject(response);
      }
      else {
        return $q.reject(response);
      }
    }
  };
})

.run(function ($rootScope, Authorizer) {
  var firstRouteLoad = true;
  $rootScope.$on('$stateChangeStart', function (event, next, nextParams) {

    // used by state Authorizor
    $rootScope.nextState       = next;
    $rootScope.nextStateParams = nextParams;

    if(!firstRouteLoad) {
      console.log('$stateChangeStart authorizing');
      Authorizer.authorize()
        .then(function (output) {
          console.log('$stateChangeStart auth result:', output);
          return output;
        });
    }
    else {
      firstRouteLoad = false;
    }
  });
});
