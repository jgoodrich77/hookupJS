'use strict';

angular.module('auditpagesApp')
  .controller('KeywordCtrl', function ($scope, $http) {

$scope.errors = {};

    $scope.addKeyword = function() {
      if($scope.newKeyword === '') {
        return;
      }
      $http
        .post('/api/keywords', { name: $scope.newKeyword })
        .success(function(){
          console.log('success:', arguments);
        })
        .error(function(){
          console.log('error:', arguments);
        });
      $scope.newKeyword = '';
    };

    $scope.deleteKeyword = function(keyword) {
      $http.delete('/keywords/' + keyword._id);
    };

  });
