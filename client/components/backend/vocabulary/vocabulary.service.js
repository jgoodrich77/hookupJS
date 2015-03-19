'use strict';

angular
.module('auditpagesApp')
.service('$vocabulary', function ($acl) {

  var
  ROLE_ADMIN = 'admin',
  ROLE_SELF  = 'self';

  var // create service registration in acl
  acl = $acl.register('vocabulary', [{// define user hierarchy
    name: ROLE_ADMIN,
    delagates: ROLE_SELF
  },{
    name: ROLE_SELF
  }],

  [
  // load all role-resource methods in dot notation
  ]);

  // allow to all roles:
  // acl.allow(ROLE_ADMIN, '*');
  // acl.allow('self.*');

  return acl.buildService('/api/vocabulary/:resource/:id', {
    id: '@_id'
  },{
    fetchLatest: {
      method: 'GET',
      params: {
        resource: 'latest'
      }
    },
    reRun: {
      method: 'GET',
      params: {
        resource: 're-run'
      }
    },
    isRunning: {
      method: 'GET',
      params: {
        resource: 'is-running'
      }
    }
  });
});