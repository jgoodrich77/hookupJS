'use strict';

angular.module('auditpagesApp')
  .factory('Keyword', function ($resource) {
    return $resource('/api/keywords/:id/:controller', {
      id: '@_id'
    }
  );
  });
