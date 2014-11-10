'use strict';
angular
        .module('auditpagesApp')
        .controller('AccountKeywordsCtrl', function ($scope, $http, Auth, socket) {
            $scope.keywords = [];

            $http.get('/api/keywords').success(function (keywords) {
                $scope.keywords = keywords;
                console.log($scope.keywords);
                socket.syncUpdates('keyword', $scope.keywords);
            });
            $scope.errors = {};

            $scope.addKeyword = function () {
                if ($scope.newKeyword === '') {
                    return;
                }
                $http.post('/api/keywords', {keyword: $scope.newKeyword});
                $scope.newKeyword = '';
            };

            $scope.deleteKeyword = function (keyword) {
                $http.delete('/keyword/' + keyword._id);
            };

        });
