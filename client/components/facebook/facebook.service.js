'use strict';

angular
.module('auditpagesApp')
.service('$fb', function ($log, $rootScope, $q, $timeout, Facebook) {

  var
  EVT_NS = '$fb',
  MSG_INVAL = 'Invalid response was received from facebook.',
  lastStatus,
  lastAuthResponse,
  lastPermissions,
  lastPermsGranted,
  lastPermsDeclined,
  ready;

  var
  permsRequired = [
    'manage_pages',
    'publish_actions',
    'read_insights'
  ],
  permsOptional = [
    'email',
    'user_website',
    'user_status',
    'user_about_me',
    'user_birthday',
    'user_likes'
  ];

  function applyReady(v) {
    ready = !!v;
  }

  function applyStatus(status) {
    lastStatus = status;

    if(!!status) {
      $rootScope.$broadcast(EVT_NS+':status_' + status);
    }
  }

  function applyAuth(authResponse) {
    lastAuthResponse = authResponse;
  }

  function applyPermissions(permissions) {

    function reducePerm(p, c) {
      p.push(c.permission);
      return p;
    }

    lastPermissions  = permissions;

    if(!permissions) {
      lastPermsGranted = [];
      lastPermsDeclined = [];
      return;
    }

    lastPermsGranted = lastPermissions
      .filter(function (o) {
        return o && o.status === 'granted';
      })
      .reduce(reducePerm, []);

    lastPermsDeclined = lastPermissions
      .filter(function (o) {
        return o && o.status === 'declined';
      })
      .reduce(reducePerm, []);
  }

  function applyFacebookResult(auth) {
    auth = auth || {};

    applyPermissions(auth.permissions || null);
    applyAuth(auth.authResponse || null);
    applyStatus(auth.status || null);
    applyReady(!!auth.status);

    return auth;
  }

  function checkPerms(list) {
    if(!lastPermissions) {
      return false;
    }

    if(!list) {
      return true;
    }
    else if(!angular.isArray(list)) {
      list = [list];
    }

    return !!list.every(function (itm) {
      return lastPermsGranted.indexOf(itm) > -1;
    });
  }

  function checkResponseError(r) {
    return (!r || r.error || r.error_code || r.error_msg);
  }

  function getErrorMsg(result, def) {
    return !!result ? (result.error ? result.error.message : result.error_msg || dev) : def;
  }

  function getStatus() {
    var
    defer = $q.defer();
    Facebook.getLoginStatus(function (auth) {
      if(checkResponseError(auth)) return defer.reject(new Error(getErrorMsg(auth, MSG_INVAL)));

      // list available permissions:
      if(auth.status === 'connected') {
        Facebook.api('/me/permissions', function (permissions) {
          if(checkResponseError(permissions)) return defer.reject(new Error(getErrorMsg(permissions, MSG_INVAL)));
          auth.permissions = permissions.data;
          defer.resolve(auth);
        });
      }
      else {
        defer.resolve(auth);
      }
    }, true);
    return defer.promise;
  }

  function authenticate() {
    var
    defer = $q.defer();
    Facebook.login(function (response) {
      if(checkResponseError(response)) return defer.reject(new Error(getErrorMsg(response, MSG_INVAL)));
      defer.resolve(response);
    }, {
      scope: permsRequired.concat(permsOptional).join(',')
    });
    return defer.promise;
  }

  function deAuthorize() {
    var
    defer = $q.defer();
    Facebook.api('/me/permissions', 'DELETE', function (response) {
      if(checkResponseError(response)) return defer.reject(new Error(getErrorMsg(response, MSG_INVAL)));

      if(response.success) {
          reloadState()
            .then(defer.resolve)
            .catch(defer.reject);
      }
      else {
        defer.reject(new Error('Unknown problem de-authorizing the account.'));
      }
    });

    return defer.promise;
  }

  function reloadState(broadcast) {
    broadcast = (broadcast === undefined || !!broadcast);

    return getStatus()
      .then(function (auth) { // get the initial status of the user once FB is ready:
        applyFacebookResult(auth, broadcast);
        return auth;
      });
  }

  function getObjects() {
    var
    defer = $q.defer();

    Facebook.api('/me/accounts', function (response) {
      if(checkResponseError(response)) return defer.reject(new Error(getErrorMsg(response, MSG_INVAL)));
      defer.resolve(response);
    });

    return defer.promise;
  }

  function getObjectInfo(object) {
    var
    defer = $q.defer();

    Facebook.api(object.id, {
      access_token: object.access_token
    }, function (response) {
      if(checkResponseError(response)) return defer.reject(new Error(getErrorMsg(response, MSG_INVAL)));
      defer.resolve(response);
    });

    return defer.promise;
  }

  function getObjectLikes(object) {
    var
    defer = $q.defer();

    Facebook.api(object.id, {
      access_token: object.access_token,
      fields: 'likes'
    }, function (response) {
      if(checkResponseError(response)) return defer.reject(new Error(getErrorMsg(response, MSG_INVAL)));
      defer.resolve(response.likes);
    });

    return defer.promise;
  }

  applyFacebookResult(); // reset

  var
  once = $rootScope
    .$watch(function () {
      return Facebook.isReady();
    }, function (ready) {
      if(!ready) return;

      reloadState()
        .then(function() {
          $rootScope.$broadcast(EVT_NS+':ready');
        });

      once(); // un-register this event listener
    });

  return {
    getStatus: getStatus,
    getObjects: getObjects,
    getObjectInfo: getObjectInfo,
    getObjectLikes: getObjectLikes,
    authenticate: authenticate,
    deAuthorize: deAuthorize,
    reloadState: reloadState,
    checkPerms: checkPerms,
    whenReady: function () {
      var
      me = this,
      defer = $q.defer(),
      currentFbStat = function(){
        return {
          active: me.isActive(),
          hasRequiredPerms: me.hasRequiredPerms(),
          hasAllPerms: me.hasAllPerms()
        };
      };

      if(!ready) {
        var once = $rootScope.$on(EVT_NS+':ready', function () {
          defer.resolve(currentFbStat());
          once();
        });
      }
      else {
        defer.resolve(currentFbStat());
      }

      return defer.promise;
    },
    isReady: function() {
      return ready;
    },
    isActive: function() {
      return ready && lastStatus === 'connected';
    },
    isNoAuth: function () {
      return ready && lastStatus === 'not_authorized';
    },
    hasRequiredPerms: function() {
      return checkPerms(permsRequired);
    },
    hasAllPerms: function() {
      return checkPerms(permsRequired.concat(permsOptional));
    },
    currentStatus: function() {
      return lastStatus;
    },
    currentAuth: function() {
      return lastAuthResponse;
    },
    currentPermissions: function() {
      return lastPermissions;
    }
  };
});