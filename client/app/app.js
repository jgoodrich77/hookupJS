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
          console.log('authorizing');
          return Authorizer.authorize()
            .then(function (output) {
              console.log('authorize result:', output);
              return output;
            });
        }]
      }
    });

  $locationProvider.html5Mode(true);
  $httpProvider.interceptors.push('authInterceptor');
})

.factory('Authorizer', function ($q, $rootScope, $state, Auth) {
  var
  stateLogin        = 'app.login',
  stateAccessDenied = 'app.error.accessdenied';
  return {
    authorize: function() {

      var
      defer      = $q.defer(),
      next       = $rootScope.nextState,
      nextParams = $rootScope.nextStateParams,
      roles      = (!!next.data && !!next.data.roles) ? next.data.roles : false;

      if(!roles) { // authorized
        console.log('state requires no roles');
        defer.resolve(true);
        console.log('resolve executed');
        return defer.promise;
      }

      console.log('authorizing state request');

      Auth.isLoggedInAsync(function (loggedIn) {
        if(!loggedIn) {
          console.log('not logged in');
          $rootScope.returnToState       = next;
          $rootScope.returnToStateParams = nextParams;
          $state.transitionTo(stateLogin);
          return defer.resolve(false);
        }

        var
        user = Auth.getCurrentUser(),
        userRole = user.role,
        allowed = angular.isArray(roles) ? (roles.indexOf(userRole) !== -1) : (roles === userRole);

        console.log('allowed:', allowed);

        if(!allowed) { // transistion to new state:
          $state.transitionTo(stateAccessDenied);
        }

        defer.resolve(allowed);
      });

      return defer.promise;
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
        // remove any stale tokens
        $cookieStore.remove('token');
        return $q.reject(response);
      }
      else {
        return $q.reject(response);
      }
    }
  };
})

.run(function ($rootScope, $location, Auth, Authorizer) {
  $rootScope.$on('$stateChangeStart', function (event, next, nextParams) {

    // used by state Authorizor
    $rootScope.nextState       = next;
    $rootScope.nextStateParams = nextParams;

    //Authorizer.authorize();
  });
});
