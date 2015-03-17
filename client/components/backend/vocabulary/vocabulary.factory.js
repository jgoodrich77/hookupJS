'use strict';

angular.module('auditpagesApp')
  .factory('Vocabulary', function ($resource) {
    return $resource('/api/vocabulary/:id/:controller', {
      id: '@_id'
    },
    {
      // ...
    });
  });
