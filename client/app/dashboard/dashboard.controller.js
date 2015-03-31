'use strict';

angular
.module('auditpagesApp')
.controller('DashboardCtrl', function ($scope, $state, $user, $timeout, Modal, Time, DateRange) {

  $scope.isDashboardHome = function() {
    return $state.current.name === 'app.dashboard';
  };

  function reloadObject() {

    $scope.fullLoading = true;

    $scope.$broadcast('dashboard-before-reload', $scope.currentFbObject, $scope.currentObjectScore);

    $user.getFacebookObject()
      .then(function (res) {
        $scope.currentFbObject = res

        return $user.getObjectScore()
          .then(function (objectScore) {
            $scope.currentObjectScore = objectScore;
            return objectScore;
          });
      })
      .then(function () {
        $scope.$broadcast('dashboard-after-reload', $scope.currentFbObject, $scope.currentObjectScore);
        return [$scope.currentFbObject, $scope.currentObjectScore];
      })
      .catch(function (err) {
        console.log('ERROR:', err);
        $scope.$broadcast('dashboard-reload-error', err);
      })
      .finally(function() {
        $scope.fullLoading = false;
        $scope.$broadcast('dashboard-reload', $scope.currentFbObject, $scope.currentObjectScore);
      });
  };

  reloadObject();

  $scope.loadPeriodStateParams = function (stateParams) { // used for sub-scopes of dashboard.

    var
    now    = new Date,
    date   = Date.parse($scope.paramDate   = stateParams.date),
    pStart = Time.parse($scope.paramPStart = stateParams.periodStart),
    pEnd   = Time.parse($scope.paramPEnd   = stateParams.periodEnd),
    dStart, dEnd;

    $scope.invalidDate        = false;
    $scope.invalidPeriodStart = false;
    $scope.invalidPeriodEnd   = false;
    $scope.currentDate        = null;
    $scope.currentStart       = null;
    $scope.currentEnd         = null;
    $scope.currentStartDate   = null;
    $scope.currentEndDate     = null;

    if(isNaN(date)) {
      $scope.invalidDate = true;
      return false;
    }
    else if(pStart === false) {
      $scope.invalidPeriodStart = true;
      return false;
    }
    else if(pEnd === false) {
      $scope.invalidPeriodEnd = true;
      return false;
    }

    $scope.currentDate  = new Date(date + (now.getTimezoneOffset() * 60000)); // as UTC!
    $scope.currentStart = pStart;
    $scope.currentEnd   = pEnd;

    dStart = pStart.toDate($scope.currentDate);
    dEnd   = pEnd.toDate($scope.currentDate);

    if(dStart > dEnd) { // swap:
      $scope.currentStart = pEnd;
      $scope.currentEnd = pStart;
      $scope.currentStartDate = dEnd;
      $scope.currentEndDate = dStart;
    }
    else {
      $scope.currentStartDate = dStart;
      $scope.currentEndDate = dEnd;
    }

    $scope.currentPeriod = new DateRange($scope.currentStartDate, $scope.currentEndDate);

    return true;
  };

  $scope.switchPage = function () {
    if(!$scope.currentFbObject) return;

    var
    lFacebookId = $scope.currentFbObject.id,
    dlg = Modal.changeObject(function (result) {
      if(result.id === lFacebookId) return;
      $user.switchFacebookObject({ switchTo: result.id, accessToken: result.access_token })
        .then(function (srvResult) {
          if(srvResult.scored === false) {
            $scope.scoringObject = true;

            (function loopCheck() {
              return $user.getObjectScore()
                .then(function (objectScore) {
                  if(objectScore.status === 'finished') { // nothing to wait for:
                    $scope.scoringObject = false;
                    return reloadObject();
                  }
                  $timeout(loopCheck, 2500);
                  return objectScore;
                })
                .catch(function (err) {
                  console.log('LOOP CHECK ERROR:', err);
                  return err;
                });
            })();
          }
          else reloadObject();

          return srvResult;
        });
    });

    dlg(lFacebookId);
  };
});
