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
  'angularUtils.directives.uiBreadcrumbs',
  'angularUtils.directives.dirPagination',
  'facebook'
])
.config(function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider, $tooltipProvider, FacebookProvider) {
  $urlRouterProvider
    .otherwise('/');

  $tooltipProvider.options({
    popupDelay: 500
  });

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
  $httpProvider.interceptors.push('TokenAuth');
  $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
  $httpProvider.defaults.withCredentials = false;
   FacebookProvider.init('1508937439378506');
})
.provider('TokenAuth',[function () {
  var
  headerName = 'authorization',
  cookieName = 'token',
  prefix     = 'Bearer ';

  this.setHeaderName = function(n) {
    headerName = n;
  }
  this.setCookieName = function(n) {
    cookieName = n;
  }
  this.setPrefix = function(n) {
    prefix = n;
  }
  this.$get = ['$auth', function ($auth) {
    return {
      'request': function(config) {
        if($auth.hasAccessToken()) {
          config.headers[headerName] = prefix + $auth.getAccessToken();
        }
        return config;
      }
    }
  }];
}])
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

.run(function ($rootScope, $state, Authorizer, stateRedirector) {
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

  $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
    switch(error.status) {
      case 404:
      $state.go('app.errors.pagenotfound', { error: error });
      break;
      case 403:
      $state.go('app.errors.accessdenied', { error: error });
      break;
    }
  });
});
