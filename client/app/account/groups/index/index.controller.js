'use strict';

angular
  .module('auditpagesApp')
  .controller('AccountGroupsIndexCtrl', function ($scope, $paginationOpts, $group, $acl) {

    $scope.loading   = false;
    $scope.loadErr   = false;
    $scope.perPage   = $paginationOpts.perPage;
    $scope.pageSizes = $paginationOpts.pageSizes;
    $scope.canEdit   = $group.canEdit;

    $scope.reload = function() {
      $scope.loading = true;

      return $group.query()
        .then(function (groups) {
          $scope.groups = groups;
        })
        .catch(function (error) {
          $scope.loadErr = error;
        })
        .finally(function () {
          $scope.loading = false;
        });
    };
  });
