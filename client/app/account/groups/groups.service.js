'use strict';

angular
.module('auditpagesApp')
.service('$accountGroups', function (Group) {

  function fetchSubscribed() {
    return Group.listSubscribed().$promise;
  }
  function fetchGroupServices(group) {
    return Group.listGroupServices(group).$promise;
  }
  function fetchServicePlans() {
    return Group.listServicePlans().$promise;
  }
  function fetchBillingSchedules() {
    return Group.listBillingSchedules().$promise;
  }
  function fetchBillingMethods() {
    return Group.listBillingMethods().$promise;
  }
  function fetchFormDependencies() {
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
  function editableRole(r) {
    return !!r && r !== 'viewer';
  }
  function isPlanBillable (p) {
    return p !== 'bronze';
  }
  function isBillableCC (method) {
    return method === 'creditcard';
  }
  function isBillablePaypal (method) {
    return method === 'paypal';
  }

  return {
    subscribed:       fetchSubscribed,
    groupServices:    fetchGroupServices,
    servicePlans:     fetchServicePlans,
    billingSchedules: fetchBillingSchedules,
    billingMethods:   fetchBillingMethods,
    formDependencies: fetchFormDependencies,
    isBillable:       isPlanBillable,
    isBillableCC:     isBillableCC,
    isBillablePaypal: isBillablePaypal,
    canEdit:          editableRole,

    master: {
      servicePlan: 'bronze',
      billingSchedule: 'monthly',
      billingMethod: {
        method: 'creditcard'
      }
    }
  };
});
