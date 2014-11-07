'use strict';

function errorCatcher() {
  return function(err) {
    console.log('Error:', err);
  }
}

angular.module('auditpagesApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'btford.socket-io',
  'ui.router',
  'ui.bootstrap',
  'angularUtils.directives.uiBreadcrumbs'
])
.config(function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {
  $urlRouterProvider
    .otherwise('/');

  // abstract state for all others to iniherit
  $stateProvider
    .state('app', {
      'abstract': true ,
      templateUrl: 'app/app.layout.html',
      data: {
        breadcrumbProxy: 'app.main'
      },
      resolve: {
        authorize: ['Authorizer', 'stateRedirector', function (Authorizer, stateRedirector) {
          return Authorizer.authorize()
            .then(stateRedirector());
        }]
      }
    });

  $locationProvider.html5Mode(true);
  $httpProvider.interceptors.push('authInterceptor');
})

.factory('stateRedirector', function ($state) {
  return function() {
   return function (redirectTo) {

      if(redirectTo) {
        return $state.transitionTo(redirectTo.state, redirectTo.params); // forward to promise
      }

      return redirectTo;
    }
  };
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

.run(function ($rootScope, Authorizer, stateRedirector) {
  var firstRouteLoad = true;
  $rootScope.$on('$stateChangeStart', function (event, next, nextParams) {

    // used by state Authorizor
    $rootScope.nextState       = next;
    $rootScope.nextStateParams = nextParams;

    if(!firstRouteLoad) {
      Authorizer.authorize()
        .then(stateRedirector());
    }
    else {
      firstRouteLoad = false;
    }
  });

  $rootScope.$on('$stateChangeSuccess', function (event, toState, toStateParams, fromState, fromStateParams) {
    $rootScope.currentState = toState.name;
  });
});
