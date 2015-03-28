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
  'angulartics',
  'angulartics.google.analytics',
  'btford.socket-io',
  'ui.router',
  'ui.bootstrap',
  'angularUtils.directives.uiBreadcrumbs',
  'angularUtils.directives.dirPagination',
  'angularFileUpload',
  'angular-calendar',
  'facebook'
])
.config(function (envConfig, $analyticsProvider, $stateProvider, $uiViewScrollProvider, $urlRouterProvider, $locationProvider, $httpProvider, $tooltipProvider, FacebookProvider) {
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
  $httpProvider.interceptors.push('authInterceptor');
  $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
  $httpProvider.defaults.withCredentials = false;
  $uiViewScrollProvider.useAnchorScroll();

  if(window.console) {
    console.log('HookupJS Version:', envConfig.version);
  }

  FacebookProvider.init(envConfig.facebookAppId);

  if(window.ga) {
    window.ga('create', envConfig.googleAnalyticsId);
  }

  // turn off automatic tracking
  // $analyticsProvider.virtualPageviews(false);
})
.factory('authInterceptor', function ($auth, $q) {
  var
  headerName = 'Authorization',
  cookieName = 'token',
  prefix     = 'Bearer ';

  return {
    // Add authorization token to headers
    request: function (config) {
      config.headers = config.headers || {};
      if($auth.hasAccessToken()) {
        config.headers[headerName] = prefix + $auth.getAccessToken();
      }
      return config;
    },

    // Intercept 401s and redirect you to login
    responseError: function(response) {
      if(response.status === 401) {
        $auth.purgeToken();
        return $q.reject(response);
      }
      else {
        return $q.reject(response);
      }
    }
  };
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

.run(function ($rootScope, $state, Authorizer, stateRedirector) {
  var firstRouteLoad = true;

  $rootScope.copyrightDate = new Date();

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
