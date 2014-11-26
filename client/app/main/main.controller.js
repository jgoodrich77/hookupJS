'use strict';

angular
.module('auditpagesApp')
.controller('MainCtrl', function ($log, $rootScope, $fb, $scope) {

  //
  // $rootScope.hideNavbar = true;

  // [
  //   'auth.login',
  //   'auth.logout',
  //   'auth.prompt',
  //   'auth.sessionChange',
  //   'auth.statusChange',
  //   'auth.authResponseChange',
  //   'xfbml.render',
  //   'edge.create',
  //   'edge.remove',
  //   'comment.create',
  //   'comment.remove'
  // ].forEach(function (v) {
  //   $rootScope.$on('Facebook:'+v, function () {
  //     $log.debug('Facebook', v, arguments);
  //   });
  // });

  // [
  //   'ready',
  //   'status_connected',
  //   'status_not_authorized',
  //   'status_unknown'
  // ].forEach(function (v) {
  //   $rootScope.$on('$fb:'+v, function () {
  //     $log.debug('$fb', v, arguments);
  //   });
  // });

  // $rootScope.$on('$fb:status_connected', function (evt) {
  //   var
  //   auth          = $fb.currentAuth(),
  //   permissions   = $fb.currentPermissions(),
  //   accessToken   = auth.accessToken,
  //   signedRequest = auth.signedRequest,
  //   userId        = auth.userID;

  //   $log.debug('User ID: (%s)', userId);
  // });

  $scope.fbCurrentStatus    = $fb.currentStatus;
  $scope.fbIsReady          = $fb.isReady;
  $scope.fbIsActive         = $fb.isActive;
  $scope.fbIsNoAuth         = $fb.isNoAuth;
  $scope.fbHasRequiredPerms = $fb.hasRequiredPerms;
  $scope.fbHasAllPerms      = $fb.hasAllPerms;

  function fbErrorHandler(err) {
    $log.warn('Facebook Error:', err);
  }

  $scope.fbDeAuthorize = function() {
    return $fb.deAuthorize()
      .catch(fbErrorHandler);
  };

  $scope.fbReAuthorize = function() {
    return $fb.deAuthorize()
      .then($scope.fbLogin)
      .catch(fbErrorHandler);
  };

  $scope.fbLogin = function() {
    return $fb.authenticate()
      .then(function (result) {
        return $fb.reloadState();
      })
      .catch(fbErrorHandler);
  };
});