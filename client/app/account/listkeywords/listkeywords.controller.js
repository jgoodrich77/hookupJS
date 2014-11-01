'use strict';

angular.module('auditpagesApp')
  .controller('ListkeywordCtrl', function ($scope, $http) {
$scope.posts = [
  'post 1',
  'post 2',
  'post 3',
  'post 4',
  'post 5'
];
$scope.errors = {};

    $scope.addKeyword = function() {
      if($scope.newKeyword === '') {
        return;
      }
//      $http
//        .post('/api/keywords', { name: $scope.newKeyword })
//        .success(function(){
//          console.log('success:', arguments);
//        })
//        .error(function(){
//          console.log('error:', arguments);
//        });
//      $scope.newKeyword = '';
    };

    $scope.deleteKeyword = function(keyword) {
      $http.delete('/keywords/' + keyword._id);
    };

  });
