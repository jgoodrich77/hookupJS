'use strict';

angular
  .module('auditpagesApp')
  .controller('AccountGroupsUpdateCtrl', function ($scope, $accountGroups, group) {

    var
    propModel = 'group',
    propServicePlans = 'servicePlans',
    propBillingSchedules = 'billingSchedules',
    propBillingMethods = 'billingMethods',
    propSaveError = 'saveErr',
    propServerError = 'serverErrors';

    $scope.formTitle = function(group) {
      return 'Update Group "'+ group.name +'"';
    };

    // generate a new form save function
    $scope.save = $accountGroups.formSave( $scope, propModel, propServerError, 'saving', propSaveError,
      propServicePlans, propBillingSchedules, propBillingMethods );

    // generate a new form reset function
    $scope.reset = $accountGroups.formReset( $scope, group, propModel, 'loading', 'loadErr',
      propSaveError, propServicePlans, propBillingSchedules, propBillingMethods );
  });
