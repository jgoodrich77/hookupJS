/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

'use strict';
angular
.module('auditpagesApp')
.controller('AccountKeywordsCtrl', function ($scope,$http, Auth, socket) {
$scope.awesomeThings = [];

    $http.get('/api/keywords').success(function(awesomeThings) {
      $scope.awesomeThings = awesomeThings;
     socket.syncUpdates('keyword', $scope.awesomeThings);
    });
    $scope.errors = {};

// $scope.addKeyword= function() {   
//      $scope.submitted = true;
//      Auth.saveKeyword({
//    keyword:$scope.newKeyword
//  })
//        .then( function() {
//          $location.path('/keyword');
//        })
//        .catch( function(err) {
//          err = err.data;
//          $scope.errors = {};
//
//          
//        });
//      
//    };

$scope.addKeyword= function() {
      if($scope.newKeyword=== '') {
        return;
      }
      $http.post('/api/keywords', { keyword: $scope.newKeyword});
      $scope.newKeyword = '';
    };

    $scope.deleteKeyword = function(keyword) {
      $http.delete('/keyword/' + keyword._id);
    };

});
