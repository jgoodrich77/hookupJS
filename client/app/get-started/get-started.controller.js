'use strict';

angular
.module('auditpagesApp')
.controller('GetStartedCtrl', function ($rootScope, $state, $fb, $user, $scope, $log, Auth, FancyCountdown) {

  //
  // $rootScope.hideNavbar = true;

  function checkUserStep(v) {
    if(v === false) return false;
    if(angular.isObject(v) && v.hasOwnProperty('step')) {
      v = v.step;
    }
    if(v > -1) {
      $scope.initSetupStep(v);
    }
    else if(v === -1) {
      $scope.setup = null;
    }
    return true;
  }

  function fbErrorHandler(err) {
    $log.warn('Facebook Error:', err);
  }

  function checkFacebookAuth() {
    return Auth.facebookAuth()
      .then(function (connectionStep) {
        // console.log('facebookAuth:', connectionStep);
        $scope.user = false;

        if(connectionStep === false) return false;

        checkUserStep(connectionStep);

        $scope.user = Auth.getCurrentUser();

        return connectionStep;
      })
      .catch(fbErrorHandler);
  }

  $fb.whenReady()
    .then(checkFacebookAuth);

  var
  cancelConnected = $rootScope.$on('$fb:status_connected', function() {
    // $log.debug('facebook is connected', arguments);

    checkFacebookAuth()
      .then(cancelConnected);
  });

  $scope.$on('$destroy', function(){ // clean up $on('$fb:status_connected') listener if not triggered
    cancelConnected();
  });

  // for views
  $scope.fbCurrentStatus    = $fb.currentStatus;
  $scope.fbIsReady          = $fb.isReady;
  $scope.fbIsActive         = $fb.isActive;
  $scope.fbIsNoAuth         = $fb.isNoAuth;
  $scope.fbHasRequiredPerms = $fb.hasRequiredPerms;
  $scope.fbHasAllPerms      = $fb.hasAllPerms;

  $scope.initSetupStep = function(step) {

    function step3Reload() {
      $scope.form.loading = true;
      $user.getFacebookScore()
        .then(function (object) {
          // console.log('object:', object);
          $scope.form.scoreRes = object;

          if(object.etaMS !== undefined) {
            $scope.form.clock = new FancyCountdown($scope, {
              delay: object.etaMS,
              interval: 100,
              useFrame: true,
              autoStart: true
            });
          }
        })
        .catch(fbErrorHandler)
        .finally(function(){
          $scope.form.loading = false;
        });
    }

    if($scope.setup === undefined) {
      $scope.setup = {};
    }

    $scope.form = {};
    $scope.setup.step = step;

    switch(step) {
      case 1:
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
      case 2:
      $scope.form.loading = true;
      $user.getFacebookObject()
        .then(function (object) {
          $scope.form.page = object;
        })
        .catch(fbErrorHandler)
        .finally(function(){
          $scope.form.loading = false;
        });
      break;
      case 3:

      $scope.$on('FancyCountdown:complete', function(evt, ctrl) {
        setTimeout(step3Reload, 2000);
      });

      step3Reload();

      break;
    }
  };

  var objectsLikes = {};

  $scope.objectLikes = function(item) {

    if(objectsLikes[item.id] !== undefined) {
      return objectsLikes[item.id];
    }

    objectsLikes[item.id] = '---';

    return $fb.getObjectLikes(item)
      .then(function (result) {
        return objectsLikes[item.id] = result;
      });
  };

  $scope.changeFacebookObject = function() {
    $scope.formError = false;
    $user.changeFacebookObject()
      .then(checkUserStep)
      .catch(function (err) {
        $scope.formError = err;
      });
  };

  $scope.setupFacebookObject = function(item) {
    $scope.formError = false;
    $user.setupFacebookObject({
      objectId: item.id,
      accessToken: item.access_token
    })
      .then(checkUserStep)
      .catch(function (err) {
        $scope.formError = err;
      });
  };

  $scope.setupPassword = function(form) {
    $scope.formError = false;
    $user.setupPassword({
      password: $scope.form.password
    })
      .then(checkUserStep)
      .catch(function (err) {
        $scope.formError = err;
      });
  };

  $scope.setupFinalize = function() {
    $scope.formError = false;
    $user.setupFinalize()
      .then(checkUserStep)
      .then(function (res) { // nav to the amazing dashboard
        $state.go('app.dashboard');
        return res;
      })
      .catch(function (err) {
        $scope.formError = err;
      });
  };
})
.controller('GetStartedNoAuthCtrl', function ($scope, $fb, $log) {
  // $log.debug('GetStartedNoAuthCtrl : init');

  $scope.form = {
    agreesWithTerms: true
  };

  $scope.fbLogin = function() {
    return $fb.authenticate()
      .then(function (result) {
        return $fb.reloadState();
      });
  };
});
