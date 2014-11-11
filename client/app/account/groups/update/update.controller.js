'use strict';

angular
  .module('auditpagesApp')
  .controller('AccountGroupsUpdateCtrl', function ($scope, $accountGroups, group) {

    var
    propModel = 'group',
    propServicePlans = 'servicePlans',
    propBillingSchedules = 'billingSchedules',
    propBillingMethods = 'billingMethods',
    propSaveError = 'saveErr';

    $scope.formTitle = function(group) {
      return 'Update Group "'+ group.name +'"';
    };

    // generate a new form save function
    $scope.save = $accountGroups.formSave( $scope, propModel, 'saving', propSaveError,
      propServicePlans, propBillingSchedules, propBillingMethods );

    // generate a new form reset function
    $scope.reset = $accountGroups.formReset( $scope, group, propModel, 'loading', 'loadErr',
      propSaveError, propServicePlans, propBillingSchedules, propBillingMethods );
  });
