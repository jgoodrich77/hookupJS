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
      list: { // fetches all available groups
        method: 'GET',
        isArray: true,
        params: {
          controller: 'list'
        }
      },
      basicInfo: { // fetches basic info for a single group
        method: 'GET',
        params: {
          controller: 'get',
          fn: 'basic'
        }
      },
      detailedInfo: { // fetches detailed info for a single group
        method: 'GET',
        params: {
          controller: 'get',
          fn: 'detail'
        }
      },

      // user methods
      listSubscribed: { // fetches groups the user is subscribed to
        method: 'GET',
        isArray: true,
        params: {
          controller: 'list-subscribed'
        }
      },
      basicInfoSubscribed: { // fetches basic info for a single group
        method: 'GET',
        params: {
          controller: 'get-subscribed',
          fn: 'basic'
        }
      },
      detailedInfoSubscribed: { // fetches detailed info for a single group
        method: 'GET',
        params: {
          controller: 'get-subscribed',
          fn: 'detail'
        }
      },
    });
  });;
