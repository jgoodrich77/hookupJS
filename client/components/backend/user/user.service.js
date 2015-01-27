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

    [
    // load all role-resource methods in dot notation
    ]);

  // allow to all roles:
  // acl.allow(ROLE_ADMIN, '*');
  // acl.allow('self.*');

  return acl.buildService('/api/users/:resource/:id', {
    id: '@_id'
  },{
    facebookLogin: {
      method: 'PUT',
      params: {
        resource: 'facebook',
        id: '@id'
      }
    },
    closeAccount: {
      method: 'POST',
      params: {
        resource:'me',
        id:'close-account'
      }
    },
    changePassword: {
      method: 'POST',
      params: {
        resource:'me',
        id:'change-password'
      }
    },
    getFacebookObject: {
      method: 'GET',
      params: {
        resource:'me',
        id:'facebook-object'
      }
    },
    getObjectScore: {
      method: 'GET',
      params: {
        resource:'me',
        id:'facebook-score'
      }
    },
    getFacebookScore: {
      method: 'GET',
      params: {
        resource:'me',
        id:'facebook-score'
      }
    },
    changeFacebookObject: {
      method: 'PUT',
      params: {
        resource: 'change-fb-object'
      }
    },
    setupFacebookObject: {
      method: 'PUT',
      params: {
        resource: 'setup-fb-object'
      }
    },
    setupPassword: {
      method: 'PUT',
      params: {
        resource: 'setup-password'
      }
    },
    setupFinalize: {
      method: 'PUT',
      params: {
        resource: 'setup-finalize'
      }
    }
  });
});