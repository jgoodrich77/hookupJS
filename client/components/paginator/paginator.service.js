'use strict';

angular
.module('auditpagesApp')
.service('$paginationOpts', function () {
  return {
    perPage: 5,
    pageSizes: [5, 10, 25]
  };
});