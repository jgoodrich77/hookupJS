'use strict';

angular
  .module('auditpagesApp')
  .controller('AccountGroupsCreateCtrl', function ($q, $scope, Group) {

    var
    master = {
      servicePlan: 'bronze',
      billingSchedule: 'monthly',
      billingMethod: {
        method: 'creditcard'
      }
    };

    $scope.loading = false;
    $scope.loadErr = false;

    function fetchServicePlans() {
      return Group.listServicePlans().$promise;
    }
    function fetchBillingSchedules() {
      return Group.listBillingSchedules().$promise;
    }
    function fetchBillingMethods() {
      return Group.listBillingMethods().$promise;
    }
    function fetchAllDependencies() {
      var tServicePlans, tBillingSchedules;

      return fetchServicePlans()
        .then(function (plans) {
          tServicePlans = plans;
          return fetchBillingSchedules();
        })
        .then(function (billingSchedules) {
          tBillingSchedules = billingSchedules;
          return fetchBillingMethods();
        })
        .then(function (billingMethods) {
          return {
            servicePlans: tServicePlans,
            billingSchedules: tBillingSchedules,
            billingMethods: billingMethods
          };
        });
    }

    $scope.reset = function(reloadDeps) {
      $scope.group = angular.copy(master);

      if(reloadDeps) {
        $scope.loading = true;
        fetchAllDependencies()
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

    $scope.ccYears = function() {
      var
      years = [],
      amount = 15,
      year = parseInt((new Date()).getFullYear()) + 1,
      yearEnd = year + amount;

      for(; year <= yearEnd; year++) {
        years.push(year);
      }

      return years;
    };

    $scope.ccMonths = function(){
      var
      months = [],
      month = 1;

      for(; month <= 12; month++) {
        months.push((month < 10) ? '0' + month : String(month));
      }

      return months;
    };

    $scope.isBillable = function() {
      return $scope.group.servicePlan !== 'bronze';
    }
    $scope.isBillableCC = function() {
      return $scope.group.billingMethod.method === 'creditcard';
    }
    $scope.isBillablePaypal = function() {
      return $scope.group.billingMethod.method === 'paypal';
    }


    return;
  });
