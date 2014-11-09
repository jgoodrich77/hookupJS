'use strict';

angular
  .module('auditpagesApp')
  .factory('BillingMethod', function ($resource) {
    return $resource('/api/billing-methods/:controller/:fn', {
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
