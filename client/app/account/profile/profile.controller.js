'use strict';

angular
.module('auditpagesApp')
.controller('AccountProfileCtrl', function ($scope, $user, $state, Modal, Auth) {

  $scope.user = Auth.getCurrentUser();

  $scope.closeAccount = function () {
    var
    confDlg = Modal.confirm.closeAccount(function() {
      $user.closeAccount().then(function () {
        Auth.logout();
        $state.go('app.main');
      });
    });
    confDlg($scope.user.name);
  };
});
