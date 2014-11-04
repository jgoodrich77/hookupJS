/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

'use strict';

angular
.module('auditpagesApp')
.controller('AccountKeywordsCtrl', function ($scope, $http) {

    $scope.errors = {};

    $scope.addKeyword = function() {
      if($scope.newKeyword === '') {
        return;
      }
      $http
        .post('/api/keyword', { name: $scope.newKeyword })
        .success(function(){
          console.log('success:', arguments);
        })
        .error(function(){
          console.log('error:', arguments);
        });
      $scope.newKeyword = '';
    };

    $scope.deleteKeyword = function(keyword) {
      $http.delete('/keyword/' + keyword._id);
    };

});
