'use strict';

angular
  .module('auditpagesApp')
  .factory('Plan', function ($resource) {
    return $resource('/api/plans/:controller/:fn', {
      controller: null,
      fn: null
    },
    {
      // admin methods
      listAll: {
        method: 'GET',
        isArray: true,
        params: {
          controller: 'list',
          fn: 'all'
        }
      },

      // user methods
      listActive: {
        method: 'GET',
        isArray: true,
        params: {
          controller: 'list',
          fn: 'active'
        }
      }
    });
  });;
