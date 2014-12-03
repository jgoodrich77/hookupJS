'use strict';

angular
.module('auditpagesApp')
.controller('GetStartedCtrl', function ($log, $rootScope, $fb, $user, $scope) {

  //
  // $rootScope.hideNavbar = true;

  $rootScope.$on('$fb:status_connected', function (evt) {
    var
    auth          = $fb.currentAuth(),
    permissions   = $fb.currentPermissions(),
    accessToken   = auth.accessToken,
    signedRequest = auth.signedRequest,
    userId        = auth.userID;

    // check if a user has already been setup for this facebook account:
    $user.facebookLogin({id: userId, token: auth.accessToken})
      .then(function (resp) {
        $scope.user = {
          id: resp.id,
          name: resp.name
        };

        if(resp.step > -1) {
          $scope.initSetupStep(resp.step);
        }
      })
      .catch(function (err) {
        $log.error('got back error:', err);
      });
  });

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
    $scope.user = null;
    $scope.setup = null;

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

  $scope.form = {
  };

  $scope.initSetupStep = function(step) {

    if($scope.setup === undefined) {
      $scope.setup = {};
    }

    $scope.setup.step = step;

    switch(step) {
      case 1:
      break;
      case 2:

      $scope.form.loading = true;

      $fb.getObjects()
        .then(function (result) {
          $scope.form.facebookObjects = result;
          $scope.form.hasObjects = !!result.data && (result.data.length > 0);
          return result;
        })
        .catch(fbErrorHandler)
        .finally(function(){
          $scope.form.loading = false;
        });

      break;
      case 3:
      break;
    }
  };

  $scope.chooseFacebookObject = function(item) {

    $scope.formError = false;

    $user.setupFacebookObject({
      id: $scope.user.id,
      objectId: item.id,
      accessToken: item.access_token
    })
      .then(function (result) {
        if(result.step > -1 && $scope.setup.step === 2) {
          $scope.initSetupStep(result.step);
        }
      })
      .catch(function (err) {
        $scope.formError = err;
      });

  };

  $scope.submitPassword = function(form) {

    $scope.formError = false;

    $user.setupPassword({
      id: $scope.user.id,
      password: $scope.form.password
    })
      .then(function (result) {
        if(result.step > -1 && $scope.setup.step === 1) {
          $scope.initSetupStep(result.step);
        }
      })
      .catch(function (err) {
        $scope.formError = err;
      });
  };
});
