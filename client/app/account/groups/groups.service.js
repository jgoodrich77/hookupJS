'use strict';

angular
.module('auditpagesApp')
.service('$accountGroups', function ($q, $group, $billingMethod, $billingSchedule, $plan) {

  function fetchFormDependencies(master) {
    var
    promiseChain = {
      servicePlans: $plan.listActive(),
      billingSchedules: $billingSchedule.listActive(),
      billingMethods: $billingMethod.listActive()
    };

    if(!!master._id) { // updating, should have role.
      if($group.canEdit(master.role, 'billing')) { // fetch billing information
        promiseChain.billingInfo = $group.subscribedGetBilling(master.role, { id: master._id});
      }
    }

    return $q.all(promiseChain);
  }

  function findAndTest(arr, arrItem, arrProp, test) {
    if(!arr || !arr.length || !arrItem || !angular.isFunction(test)) return false;

    var match = false;

    arr.every(function (possible) {
      var found = false;
      if(possible[arrProp] === arrItem) {
        match = test(possible);
        found = true;
      }

      return !found;
    });

    return match;
  }

  function findDefault(arr, arrProp, keepProp) {
    var item = false;

    arr.every(function (T) {
      if(!!T[arrProp]) {
        item = !!keepProp ? T[keepProp] : T;
      }
      return !item;
    });

    return item;
  }

  function findDefaultPlan (ap) {
    return findDefault(ap, 'groupDefault', '_id');
  }
  function findDefaultBillingSchedule (bs) {
    return findDefault(bs, 'groupDefault', '_id');
  }
  function findDefaultBillingMethod (bm) {
    return findDefault(bm, 'groupDefault', '_id');
  }
  function isPlanBillable (p, ap) {
    return findAndTest(ap, p, '_id', function (itm) {
      return itm.monthlyCost > 0;
    });
  }
  function isBillableCC (bmm, abm) {
    return findAndTest(abm, bmm, '_id', function (itm) {
      return itm.adapter.factoryClass === 'credit-card';
    });
  }
  function isBillablePaypal (bmm, abm) {
    return findAndTest(abm, bmm, '_id', function (itm) {
      return itm.adapter.factoryClass === 'paypal';
    });
  }
  function isPaypalAgreement (bm, abm) {
    return isBillablePaypal (bm.method, abm) &&
      !!bm.detail.ppAggreementId &&
      !!bm.detail.ppAccountHolder;
  }

  function applyDefaults(scope, modelProp, servicePlansProp, billingSchedulesProp, billingMethodsProp) {

      var
      defaultPlan = findDefaultPlan(scope[servicePlansProp]),
      defaultSched = findDefaultBillingSchedule(scope[billingSchedulesProp]),
      defaultMethod = findDefaultBillingMethod(scope[billingMethodsProp]);

      if(!!defaultPlan && !scope[modelProp].servicePlan) {
        scope[modelProp].servicePlan = defaultPlan;
      }

      if(!!defaultSched && !scope[modelProp].billingSchedule) {
        scope[modelProp].billingSchedule = defaultSched;
      }

      if(!!defaultMethod && (!scope[modelProp].billingMethod||!scope[modelProp].billingMethod.method)) {
        if(!scope[modelProp].billingMethod) {
          scope[modelProp].billingMethod = {};
        }

        scope[modelProp].billingMethod.method = defaultMethod;
      }
  }

  function modelFormReset(scope, master, modelProp, loadingProp, loadErrorProp, saveErrorProp, servicePlansProp, billingSchedulesProp, billingMethodsProp) {
    return function(reloadDeps) {
      scope[modelProp] = angular.copy(scope.master = master); // don't taint master
      scope[loadErrorProp] = false;
      scope[saveErrorProp] = false;

      if(reloadDeps) {
        scope[loadingProp] = true;

        fetchFormDependencies(master)
          .then(function (deps) {

            // setup scope with dependencies
            scope[servicePlansProp]     = deps.servicePlans;
            scope[billingSchedulesProp] = deps.billingSchedules;
            scope[billingMethodsProp]   = deps.billingMethods;

            if(deps.billingInfo) {
              angular.extend(scope[modelProp], deps.billingInfo);
            }

            // apply defaults in form
            applyDefaults(scope, modelProp, servicePlansProp, billingSchedulesProp, billingMethodsProp);
          })
          .catch(function (error) {
            scope[loadErrorProp] = error;
            return error;
          })
          .finally(function(){
            scope[loadingProp] = false;
          });
      }
      else { // apply defaults from previously loaded data stored in memory
        applyDefaults(scope, modelProp, servicePlansProp, billingSchedulesProp, billingMethodsProp);
      }
    }
  }

  function modelFormSave(scope, modelProp, savingProp, saveErrorProp, servicePlansProp, billingSchedulesProp, billingMethodsProp) {
    return function() {
      var
      model = scope[modelProp];

      scope[saveErrorProp] = false;
      scope[savingProp] = true;

      return $group.save(model)
        .then(function (doc) {
          console.log('Saved Doc:', doc, 'original:', model);
          return doc;
        })
        .catch(function (err) {
          console.log('error:', err);
          scope[saveErrorProp] = err;
          return err;
        })
        .finally(function () {
          scope[savingProp] = false;
        });
    }
  }

  return {
    formDependencies:  fetchFormDependencies,
    isBillable:        isPlanBillable,
    isBillableCC:      isBillableCC,
    isBillablePaypal:  isBillablePaypal,
    isPaypalAgreement: isPaypalAgreement,
    formReset:         modelFormReset,
    formSave:          modelFormSave
  };
});
