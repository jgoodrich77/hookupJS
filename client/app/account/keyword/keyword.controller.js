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
                $http.post('/api/keywords', {keyword: $scope.newKeyword});
                 $scope.latestKeyword = $scope.newKeyword;
                $scope.newKeyword = '';
            };

            $scope.deleteKeyword = function (keyword) {
                $http.delete('/keyword/' + keyword._id);
            };

        });
