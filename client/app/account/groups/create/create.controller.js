'use strict';

angular
  .module('auditpagesApp')
  .controller('AccountGroupsCreateCtrl', function ($q, $scope, $accountGroups) {

    var
    master = {},
    propModel = 'group',
    propServicePlans = 'servicePlans',
    propBillingSchedules = 'billingSchedules',
    propBillingMethods = 'billingMethods',
    propSaveError = 'saveErr',
    propServerError = 'serverErrors';

    // generate a new form save function
    $scope.save = $accountGroups.formSave( $scope, propModel, propServerError,'saving', propSaveError,
      propServicePlans, propBillingSchedules, propBillingMethods );

    // generate a new form reset function
    $scope.reset = $accountGroups.formReset( $scope, master, propModel, 'loading', 'loadErr',
      propSaveError, propServicePlans, propBillingSchedules, propBillingMethods );
  });
