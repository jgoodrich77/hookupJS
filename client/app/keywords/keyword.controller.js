'use strict';

angular.module('auditpagesApp')
  .controller('KeywordCtrl', function ($scope, $http) {

$scope.errors = {};

    $scope.addKeyword = function() {
      if($scope.newKeyword === '') {
        return;
      }
      $http.post('/keywords', { name: $scope.newKeyword });
      $scope.newKeyword = '';
    };

    $scope.deleteKeyword = function(keyword) {
      $http.delete('/keywords/' + keyword._id);
    };

  });
