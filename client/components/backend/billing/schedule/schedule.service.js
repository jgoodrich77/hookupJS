'use strict';

angular
.module('auditpagesApp')
.service('$billingSchedule', function ($acl, BillingSchedule) {

  // var
  // ROLE_OWNER  = 'owner',
  // ROLE_EDITOR = 'editor',
  // ROLE_VIEWER = 'viewer';

  // var // create service registration in acl
  // acl = $acl.register('billingSchedule',

  //   [{// define user hierarchy
  //     name: ROLE_OWNER,
  //     delagates: [ROLE_EDITOR, ROLE_VIEWER]
  //   },{
  //     name: ROLE_EDITOR,
  //     delagates: ROLE_VIEWER
  //   },{
  //     name: ROLE_VIEWER
  //   }],

  //   [ // load all resources in dot notation
  //   ]);

  // // owner allowed to all
  // acl.allow(ROLE_OWNER, '*');

  // // switch roles into white-list mode
  // acl.deny(ROLE_EDITOR, '*');
  // acl.deny(ROLE_VIEWER, '*');

  // // optimize the querying at this point
  // acl.finish();

  return {
    listActive: function () {
      return BillingSchedule.listActive().$promise;
    }
  };
});;
