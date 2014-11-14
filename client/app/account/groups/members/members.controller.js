'use strict';

angular
  .module('auditpagesApp')
  .controller('AccountGroupsMembersCtrl', function ($scope, $group, group) {

    $scope.group = angular.copy(group);
    $scope.members = [];

    $scope.allRoles = [
      ['owner', 'Co-Owner'],
      ['editor', 'Editor'],
      ['viewer', 'Viewer']
    ];

    function loadMembers() {
      return $group.subscribedGetMembers(group.role, {id: group._id})
        .then(function (detail) {
          $scope.members = detail.members;
        });
    }

    $scope.resetInvitations = function() {
      $scope.tempInvites = [{}];
    };
    $scope.reload = function() {
      return loadMembers();
    };

    $scope.resetInvitations();

    return;
  });
