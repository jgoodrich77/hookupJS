'use strict';

angular
  .module('auditpagesApp')
  .factory('Group', function ($resource) {
    return $resource('/api/groups/:controller/:fn', {
      controller: null,
      fn: null
    },
    {
      // admin methods
      listAll: { // fetches all available groups
        method: 'GET',
        isArray: true,
        params: {
          controller: 'list',
          fn: 'all'
        }
      },

      // user methods
      listSubscribed: { // fetches groups the user is subscribed to
        method: 'GET',
        isArray: true,
        params: {
          controller: 'list',
          fn: 'subscribed'
        }
      },
      listServices: { // fetches services group is subscribed to
        method: 'GET',
        isArray: true,
        params: {
          controller: 'list',
          fn: 'services'
        }
      },
      listServicePlans: { // fetches all available service plans for groups
        method: 'GET',
        isArray: true,
        params: {
          controller: 'list',
          fn: 'service-plans'
        }
      },
      listBillingSchedules: { // fetches all available billing schedules for groups
        method: 'GET',
        isArray: true,
        params: {
          controller: 'list',
          fn: 'billing-schedules'
        }
      },
      listBillingMethods: { // fetches all available billing methods for groups
        method: 'GET',
        isArray: true,
        params: {
          controller: 'list',
          fn: 'billing-methods'
        }
      },
      getBasic: {
        method: 'GET',
        params: {
          controller: 'get',
          fn: 'basic'
        }
      },
      getDetail: {
        method: 'GET',
        params: {
          controller: 'get',
          fn: 'detail'
        }
      }
    });
  });;
