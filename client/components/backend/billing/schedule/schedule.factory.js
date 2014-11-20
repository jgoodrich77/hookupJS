'use strict';

angular
  .module('auditpagesApp')
  .factory('BillingSchedule', function ($resource) {
    return $resource('/api/billing-schedules/:controller/:fn', {
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
