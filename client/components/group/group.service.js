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
