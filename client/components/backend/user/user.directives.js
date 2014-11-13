'use strict';

angular
.module('auditpagesApp')
.directive('userPasswordForm', function () {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      saveFn:           '=onSaveFn',
      resetFn:          '=onResetFn',
      model:            '=formModel',
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
      saveButton:       '@formSaveButton',
      resetButton:      '@formResetButton'
    },
    templateUrl: 'components/backend/user/user.password-form-tpl.html',
    link: function(scope, el, attrs, controller) {
    }
  };
})
.directive('userProfileForm', function () {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      saveFn:           '=onSaveFn',
      resetFn:          '=onResetFn',
      model:            '=formModel',
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
      saveButton:       '@formSaveButton',
      resetButton:      '@formResetButton'
    },
    templateUrl: 'components/backend/user/user.profile-form-tpl.html',
    link: function(scope, el, attrs, controller) {
    }
  };
});
