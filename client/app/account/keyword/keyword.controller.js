'use strict';
angular
        .module('auditpagesApp')
        .controller('AccountKeywordsCtrl', function ($scope, $http, Auth, socket) {
            $scope.keywords = [];

            $http.get('/api/keywords').success(function (keywords) {
                $scope.keywords = keywords;
                socket.syncUpdates('keyword', $scope.keywords);
            });
            
              for(var i=0;($scope.keywords).length;i++){
                  console.log($scope.keywords);
              }
              
             $scope.today = new Date();
            $scope.errors = {};

            $scope.addKeyword = function () {
                if ($scope.newKeyword === '') {
                    return;
                }
                
                Auth.isLoggedIn({
          
        }).then( function(isloggedIn) {
          if(!isloggedIn){
         
           $location.path('/login');
      }
        })
                $http.post('/api/keywords', {keyword: $scope.newKeyword});
                 $scope.latestKeyword = $scope.newKeyword;
                $scope.newKeyword = '';
            };

            $scope.deleteKeyword = function (keyword) {
                $http.delete('/api/keywords/' + keyword._id);
            };
             $scope.editKeyword = function (keyword) {
              
console.log($scope.updatekey);
                
                  $http.put('/api/keywords/' + keyword._id, {keyword: keyword});
                 //   $scope.updatekey= '';
            };
            
            
            
            
            
            $scope.title = "Welcome to this demo!";
  $scope.editorEnabled = false;

  $scope.enableEditor = function() {
    $scope.editorEnabled = true;
    $scope.editableTitle = $scope.title;
  };

  $scope.disableEditor = function() {
    $scope.editorEnabled = false;
  };

  $scope.save = function() {
    $scope.title = $scope.editableTitle;
    console.log($scope.title);
    $scope.disableEditor();
  };


        });
