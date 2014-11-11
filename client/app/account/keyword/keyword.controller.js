'use strict';
angular
        .module('auditpagesApp')
        .controller('AccountKeywordsCtrl', function ($scope, $http, Auth, socket,$location) {
            $scope.keywords = [];
  Auth.isLoggedIn = function (isloggedIn) {
      console.log(isloggedIn);
                    if (!isloggedIn) {

                        $location.path('/login');
                    }
                }
            $http.get('/api/keywords').success(function (keywords) {
                $scope.keywords = keywords;
                socket.syncUpdates('keyword', $scope.keywords);
            });
            $scope.errors = {};

            $scope.addKeyword = function () {
                if ($scope.newKeyword === '') {
                    return;
                }

                Auth.isLoggedIn = function (isloggedIn) {
                    if (!isloggedIn) {

                        $location.path('/login');
                    }
                }
                $http.post('/api/keywords', {keyword: $scope.newKeyword});
                $scope.latestKeyword = $scope.newKeyword;
                $scope.newKeyword = '';
            };

            $scope.deleteKeyword = function (keyword) {
                $http.delete('/api/keywords/' + keyword._id);
            };
            
            $scope.editorEnabled = false;

            $scope.enableEditor = function (keyword) {
                $scope.editorEnabled = true;
                $scope.keyword_id = keyword._id;
                $scope.editableTitle = keyword.keyword;
            };

            $scope.disableEditor = function () {
                $scope.editorEnabled = false;
            };

            $scope.save = function (id) {
                $scope.title = $scope.editableTitle;
                console.log($scope.title);
                $http.put('/api/keywords/' + id, {keyword: $scope.editableTitle});
                $scope.disableEditor();
            };


        });
