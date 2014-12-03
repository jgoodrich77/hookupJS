'use strict';

angular
.module('auditpagesApp')
.directive('mustMatch', function () {
  return {
    restrict: 'A',
    require: 'ngModel',
    scope: {
      otherValue: '=mustMatch'
    },
    link: function(scope, element, attrs, ctrl) {
      if(!ctrl) return;
      var
      validityKey = 'matches',
      mustMatch;

      function validate(value) {
        if(ctrl.$isEmpty(value)) {
          ctrl.$setValidity(validityKey, true);
          return;
        }

        ctrl.$setValidity(validityKey, value === mustMatch);
        return value;
      }

      ctrl.$formatters.push(validate);
      ctrl.$parsers.unshift(validate);
      attrs.$observe('mustMatch', function() {
        validate(ctrl.$viewValue);
      });
      scope.$watch('otherValue', function (nV) {
        mustMatch = nV;
      });
    }
  };
});