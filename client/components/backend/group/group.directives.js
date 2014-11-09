'use strict';

angular
  .module('auditpagesApp')
  .directive('adminGroupForm', function () {
  })
  .directive('accountGroupForm', function ($accountGroups, $creditCard) {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        saveFn:           '=onSaveFn',
        resetFn:          '=onResetFn',
        model:            '=formModel',
        servicePlans:     '=formServicePlans',
        billingSchedules: '=formBillingSchedules',
        billingMethods:   '=formBillingMethods',
        loading:          '=formLoading',
        saving:           '=formSaving',
        loadError:        '=formLoadError',
        saveError:        '=formSaveError',
        title:            '@formTitle',
        description:      '@formDescription',
        loadMessage:      '@formLoadMessage',
        saveMessage:      '@formSavingMessage',
        loadErrorTitle:   '@formLoadErrorTitle',
        loadErrorMessage: '@formLoadErrorMessage',
        saveErrorTitle:   '@formSaveErrorTitle',
        saveErrorMessage: '@formSaveErrorMessage',
        saveGroupButton:  '@formSaveGroupButton',
        resetGroupButton: '@formResetGroupButton'
      },
      templateUrl: 'components/backend/group/group.account-form-tpl.html',
      link: function(scope, el, attrs, controller) {

        scope.ccYears  = $creditCard.listYears();
        scope.ccMonths = $creditCard.listMonths();

        var
        propServicePlan = 'servicePlan',
        propBillingMethod = 'billingMethod';

        function mcheck(prop) {
          return !!scope.model && !!scope.model[prop];
        }

        scope.isBillable = function() {
          if(!mcheck(propServicePlan)) return false;
          return $accountGroups.isBillable(scope.model[propServicePlan], scope.servicePlans);
        };
        scope.isBillableCC = function() {
          if(!mcheck(propBillingMethod)) return false;
          return $accountGroups.isBillableCC(scope.model[propBillingMethod].method, scope.billingMethods);
        };
        scope.isBillablePaypal = function() {
          if(!mcheck(propBillingMethod)) return false;
          return $accountGroups.isBillablePaypal(scope.model[propBillingMethod].method, scope.billingMethods);
        };
        scope.isPaypalAgreement = function() {
          if(!mcheck(propBillingMethod)) return false;
          return $accountGroups.isPaypalAgreement(scope.model[propBillingMethod], scope.billingMethods);
        };
      }
    };
  });
