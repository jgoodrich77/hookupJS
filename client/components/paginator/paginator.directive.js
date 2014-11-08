'use strict';

angular
.module('auditpagesApp')
.directive('sitePaginator', function () {
  return {
    restrict: 'E',
    templateUrl: 'components/paginator/paginator.html',
    replace: true,
    scope: {
      totalItems: '=?',
      itemsPerPage: '=?',
      pageSizes: '=?'
    },
    link: function(scope, el, attrs) {
      scope.setItemsPerPage = function(n) {
        scope.itemsPerPage = n;
      };
    }
  };
});