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
      $scope.loading = true;

      return $group.subscribedGetMembers(group.role, {id: group._id})
        .then(function (detail) {
          $scope.members = detail.members;
          $scope.invites = detail.invites;

          $scope.invites.push({}); // always add an empty one at the end
        })
        .catch(function (response) {
          $scope.loadError = response.data;
        })
        .finally(function(){
          $scope.loading = false;
        });
    }

    $scope.cancelInvitation = function(invite) {

      $scope.inviting = true;
      $scope.inviteError = false;

      return $group.subscribedInviteCancel(group.role, {
        _id: group._id,
        invite: invite
      })
      .then(function (response) {
        return $scope.reload();
      })
      .catch(function (response) {
        $scope.inviteError = response.data;
      })
      .finally(function(){
        $scope.inviting = false;
      });
    };

    $scope.inviteMembers = function(form) {
      if(!form.$valid && !$scope.invites.length) {
        return;
      }

      $scope.inviting = true;
      $scope.inviteError = false;

      return $group.subscribedInviteMember(group.role, {
        _id: group._id,
        invites: $scope.invites
      })
      .then(function (response) {
        return $scope.reload();
      })
      .catch(function (response) {
        $scope.inviteError = response.data;
      })
      .finally(function(){
        $scope.inviting = false;
      });
    };

    $scope.reload = function() {
      $scope.inviting = false;
      $scope.inviteError = false;
      return loadMembers();
    };

    return;
  });
