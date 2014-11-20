'use strict';

angular
.module('auditpagesApp')
.factory('Authorizer', function ($q, $rootScope, $state, Auth) {

  var
  stateLogin        = 'app.login',
  stateAccessDenied = 'app.errors.accessdenied';

  return {
    authorize: function() {

      var
      defer      = $q.defer(),
      next       = $rootScope.nextState,
      nextParams = $rootScope.nextStateParams,
      roles      = (!!next.data && !!next.data.roles) ? next.data.roles : false;

      if(!roles) { // authorized
        defer.resolve(false); // no redirect needed
      }
      else {

        Auth.isLoggedInAsync(function (loggedIn) {
          if(!loggedIn) {

            // remember current state for when we login
            $rootScope.returnToState       = next;
            $rootScope.returnToStateParams = nextParams;

            // resolve to login page
            defer.resolve({state: stateLogin, params: {}});
            return;
          }

          var
          user = Auth.getCurrentUser(),
          userRole = user.role,
          allowed = angular.isArray(roles) ? (roles.indexOf(userRole) !== -1) : (roles === userRole);

          if(!allowed) { // resolve to access denied page
            defer.resolve({state: stateAccessDenied, params: {}});
          }
          else { // resolve original state name and params
            defer.resolve(false); // no redirect needed
          }
        });
      }

      return defer.promise;
    }
  };
})
.factory('Auth', function Auth($location, $rootScope, $http, User, $cookieStore, $q) {
  var currentUser = {};
  if($cookieStore.get('token')) {
    currentUser = User.get();
  }

  return {

    /**
     * Authenticate user and save token
     *
     * @param  {Object}   user     - login info
     * @param  {Function} callback - optional
     * @return {Promise}
     */
    login: function(user, callback) {
      var cb = callback || angular.noop;
      var deferred = $q.defer();

      $http.post('/auth/local', {
        email: user.email,
        password: user.password
      }).
      success(function(data) {
        $cookieStore.put('token', data.token);
        currentUser = User.get();
        deferred.resolve(data);
        return cb();
      }).
      error(function(err) {
        this.logout();
        deferred.reject(err);
        return cb(err);
      }.bind(this));

      return deferred.promise;
    },

    /**
     * Delete access token and user info
     *
     * @param  {Function}
     */
    logout: function() {
      $cookieStore.remove('token');
      currentUser = {};
    },

    /**
     * Create a new user
     *
     * @param  {Object}   user     - user info
     * @param  {Function} callback - optional
     * @return {Promise}
     */
    createUser: function(user, callback) {

      var cb = callback || angular.noop;

      return User.save(user,
        function(data) {
          $cookieStore.put('token', data.token);
          currentUser = User.get();
          return cb(user);
        },
        function(err) {
          this.logout();
          return cb(err);
        }.bind(this)).$promise;
    },

    /**
     * Change password
     *
     * @param  {String}   oldPassword
     * @param  {String}   newPassword
     * @param  {Function} callback    - optional
     * @return {Promise}
     */
    changePassword: function(oldPassword, newPassword, callback) {
      var cb = callback || angular.noop;

      return User.changePassword({ id: currentUser._id }, {
        oldPassword: oldPassword,
        newPassword: newPassword
      }, function(user) {
        return cb(user);
      }, function(err) {
        return cb(err);
      }).$promise;
    },

    /**
     * Gets all available info on authenticated user
     *
     * @return {Object} user
     */
    getCurrentUser: function() {
      return currentUser;
    },

    /**
     * Check if a user is logged in
     *
     * @return {Boolean}
     */
    isLoggedIn: function() {
      return currentUser.hasOwnProperty('role');
    },

    /**
     * Waits for currentUser to resolve before checking if user is logged in
     */
    isLoggedInAsync: function(cb) {
      if(currentUser.hasOwnProperty('$promise')) {
        currentUser.$promise.then(function() {
          cb(true);
        }).catch(function() {
          cb(false);
        });
      } else if(currentUser.hasOwnProperty('role')) {
        cb(true);
      } else {
        cb(false);
      }
    },

    /**
     * Check if a user is an admin
     *
     * @return {Boolean}
     */
    isAdmin: function() {
      return currentUser.role === 'admin';
    },

    /**
     * Get auth token
     */
    getToken: function() {
      return $cookieStore.get('token');
    }
  };
});
