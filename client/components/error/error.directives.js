'use strict';

angular
  .module('auditpagesApp')
  .directive('errorDisplay', function () {
    return {
      restrict: 'E',
      templateUrl: 'components/error/error.html',
      replace: true,
      scope: {
        title: '=errorTitle',
        message: '=errorMessage',
        detail: '=errorDetail'
      }
    };
  });
