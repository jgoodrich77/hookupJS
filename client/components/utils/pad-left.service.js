'use strict';

angular
.module('auditpagesApp')
.service('$padLeft', function() {
  return function (nr, n, str) {
    return Array(n-String(nr).length+1).join(str||'0')+nr;
  };
});