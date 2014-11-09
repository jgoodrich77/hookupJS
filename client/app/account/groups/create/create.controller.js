'use strict';

angular
  .module('auditpagesApp')
  .controller('AccountGroupsCreateCtrl', function ($q, $scope, $creditCard, $accountGroups, Group) {

    $scope.loading  = false;
    $scope.loadErr  = false;
    $scope.ccYears  = $creditCard.listYears();
    $scope.ccMonths = $creditCard.listMonths();

    $scope.reset = function(reloadDeps) {
      $scope.group = angular.copy($accountGroups.master);

      if(reloadDeps) {
        $scope.loading = true;
        $accountGroups.formDependencies()
          .then(function (deps) {
            $scope.servicePlans     = deps.servicePlans;
            $scope.billingSchedules = deps.billingSchedules;
            $scope.billingMethods   = deps.billingMethods;
          })
          .catch(function (error) {
            $scope.loadErr = error;
            return error;
          })
          .finally(function(){
            $scope.loading = false;
          });
      }
    };
    $scope.isBillable = function() {
      return $accountGroups.isBillable($scope.group.servicePlan);
    };
    $scope.isBillableCC = function() {
      return $accountGroups.isBillableCC($scope.group.billingMethod.method);
    };
    $scope.isBillablePaypal = function() {
      return $accountGroups.isBillablePaypal($scope.group.billingMethod.method);
    };
  });
