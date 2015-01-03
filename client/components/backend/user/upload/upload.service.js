'use strict';

angular
.module('auditpagesApp')
.service('$userUpload', function ($acl, $upload) {

  var
  ROLE_ADMIN = 'admin',
  ROLE_SELF  = 'self';

  var // create service registration in acl
  acl = $acl.register('userUpload',

    [{// define user hierarchy
      name: ROLE_ADMIN,
      delagates: ROLE_SELF
    },{
      name: ROLE_SELF
    }],

    [
    // load all role-resource methods in dot notation
    ]);

  var api = acl.buildService('/api/user-uploads/:resource/:id', {
    id: '@_id'
  },{

  });

  api.doUpload = function (file) {
    return $upload.upload({
      url: '/api/user-uploads',
      file: file
    });
  };

  return api;
});