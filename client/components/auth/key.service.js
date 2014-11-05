'use strict';

angular.module('auditpagesApp')
  .factory('Key', function Key($location, $rootScope, $http, Keyword, $cookieStore, $q) {
    

    return {

      /**
       * Authenticate user and save token
       *
       * @param  {Object}   user     - login info
       * @param  {Function} callback - optional
       * @return {Promise}
       */
     

      /**
       * Delete access token and user info
       *
       * @param  {Function}
       */
      

      /**
       * Create a new user
       *
       * @param  {Object}   user     - user info
       * @param  {Function} callback - optional
       * @return {Promise}
       */
     
        saveKeyword: function(user) {
       console.log('fgvd');

        return Keyword.save(user,
          function(data) {
         
            return true;
          },
          function(err) {
            this.logout();
        
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
      

      /**
       * Gets all available info on authenticated user
       *
       * @return {Object} user
       */
      

      /**
       * Check if a user is logged in
       *
       * @return {Boolean}
       */
      

      /**
       * Waits for currentUser to resolve before checking if user is logged in
       */
     

      /**
       * Check if a user is an admin
       *
       * @return {Boolean}
       */
     
      /**
       * Get auth token
       */
      
    };
  });
