'use strict';

angular
.module('auditpagesApp')
.service('$group', function ($acl) {

  var
  ROLE_ADMIN  = 'admin',
  ROLE_OWNER  = 'owner',
  ROLE_EDITOR = 'editor',
  ROLE_VIEWER = 'viewer';

  var // create service registration in acl
  acl = $acl.register('group',

    [{// define user hierarchy
      name: ROLE_ADMIN,
      delagates: ROLE_OWNER
    },{
      name: ROLE_OWNER,
      delagates: [ROLE_EDITOR, ROLE_VIEWER]
    },{
      name: ROLE_EDITOR,
      delagates: ROLE_VIEWER
    },{
      name: ROLE_VIEWER
    }],

    [ // load all resource methods in dot notation
    'global.query',
    'global.get',
    'global.get.billing',
    'global.get.services',
    'global.get.members',
    'global.update',
    'global.update.billing',
    'global.update.services',
    'global.update.members',
    'subscribed.get',
    'subscribed.get.billing',
    'subscribed.get.services',
    'subscribed.get.members',
    'subscribed.update',
    'subscribed.update.billing',
    'subscribed.update.services',
    'subscribed.update.members'
    ]);

  // allow to all roles:
  acl.allow(ROLE_ADMIN, '*');
  acl.allow('subscribed.*');
  acl.deny(ROLE_EDITOR, [
    '*.billing'
  ]);
  acl.deny(ROLE_VIEWER, [
    'subscribed.update',
    'subscribed.update.*'
  ]);

  var
  api = acl.buildService('/api/groups/:resource/:id', {
    id: '@_id'
  },{
    query: {
      method: 'GET',
      isArray: true,
      params: {
        resource: 'subscribed.query'
      }
    },
    create: {
      method: 'POST',
      params: {
        resource: 'create'
      }
    }
  });

  api.canEdit = function(r, detail) {

    var
    requireResources, requireAll;

    if(!!detail) {
      requireAll = true;

      switch(detail) {
        case 'billing':
        requireResources = 'subscribed.update.billing';
        break;
        case 'services':
        requireResources = 'subscribed.update.services';
        break;
        case 'members':
        requireResources = 'subscribed.update.members';
        break;
        default:
        throw 'Invalid detail was provided';
        break;
      }
    }
    else {
      requireAll = false;
      requireResources = [
        'subscribed.update',
        'subscribed.update.members',
        'subscribed.update.billing',
        'subscribed.update.services',
        'subscribed.update.members'
      ];
    }

    return (requireAll)
      ? acl.testAll(r, requireResources)
      : acl.testAny(r, requireResources);
  };

  return api;
});;
