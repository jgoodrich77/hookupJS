'use strict';

angular
.module('auditpagesApp')
.service('$user', function ($acl) {

  var
  ROLE_ADMIN = 'admin',
  ROLE_SELF  = 'self';

  var // create service registration in acl
  acl = $acl.register('user',

    [{// define user hierarchy
      name: ROLE_ADMIN,
      delagates: ROLE_SELF
    },{
      name: ROLE_SELF
    }],

    [ // load all resource methods in dot notation
    'global.query',
    'global.get',
    'global.get.groups',
    'global.update',
    'global.update.security',
    'self.get',
    'self.get.groups',
    'self.update',
    'self.update.security'
    ]);

  // allow to all roles:
  acl.allow(ROLE_ADMIN, '*');
  acl.allow('self.*');

  var
  api = acl.buildService('/api/users/:resource/:id', {
    id: '@_id'
  },{
    create: {
      method: 'POST',
      params: {
        resource: 'create'
      }
    },
    facebookLogin: {
      method: 'PUT',
      params: {
        resource: 'facebook',
        id: '@id'
      }
    },
    setupPassword: {
      method: 'PUT',
      params: {
        resource: 'setup-password',
        id: '@id'
      }
    },
    setupFacebookObject: {
      method: 'PUT',
      params: {
        resource: 'setup-fb-object',
        id: '@id'
      }
    }
  });

  //
  // do other things to API
  //

  return api;
});