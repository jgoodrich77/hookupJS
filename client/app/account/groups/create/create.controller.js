'use strict';

angular
  .module('auditpagesApp')
  .controller('AccountGroupsCreateCtrl', function ($q, $scope, $accountGroups) {

    var
    master = {
      servicePlan: 'bronze',
      billingSchedule: 'monthly',
      billingMethod: {
        method: 'creditcard'
      }
    },
    propModel = 'group',
    propServicePlans = 'servicePlans',
    propBillingSchedules = 'billingSchedules',
    propBillingMethods = 'billingMethods';

    // generate a new form save function
    $scope.save = $accountGroups.formSave( $scope, master, propModel, 'saving', 'saveErr',
      propServicePlans, propBillingSchedules, propBillingMethods );

    // generate a new form reset function
    $scope.reset = $accountGroups.formReset( $scope, master, propModel, 'loading', 'loadErr',
      propServicePlans, propBillingSchedules, propBillingMethods );
  });
