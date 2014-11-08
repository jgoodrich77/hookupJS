'use strict';

angular
  .module('auditpagesApp')
  .controller('AccountGroupsIndexCtrl', function ($scope, Group) {

    function fetchSubscribedGroups() {
      return Group.listSubscribed().$promise;
    }
    function fetchGroupServices(group) {
      return Group.listGroupServices(group).$promise;
    }

    $scope.loading = false;
    $scope.loadErr = false;
    $scope.perPage = 5;
    $scope.pageSizes = [1, 5, 10, 25];

    $scope.reload = function() {
      $scope.loading = true;

      return fetchSubscribedGroups()
        .then(function (groups) {

          $scope.groups = groups;
          $scope.loading = false;
        })
        .catch(function (error) {
          $scope.loading = false;
          $scope.loadErr = error;
        });
    };
  });
