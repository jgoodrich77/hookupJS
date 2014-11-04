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
$scope.keywords = [ {
   "_id": ObjectId("5451c2cf0d90f415458b4567"),
   "keyword": "mobile phone",
   "__v": NumberLong(0)
},
 {
   "_id": ObjectId("54502ba33dd00722b92ce18e"),
   "keyword": "digital cameras",
   "__v": NumberInt(0)
}	

];
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
