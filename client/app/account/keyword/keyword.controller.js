'use strict';
angular
        .module('auditpagesApp')
        .controller('AccountKeywordsCtrl', function ($scope, $http, Auth, socket, $location,$rootScope) {
            $scope.keywords = [];
  var getCurrentUser = Auth.getCurrentUser();
  var redirect=0;
if(!getCurrentUser.name){
   var redirect=1;
}
if(redirect=='1'){
     $location.path('/login');
     return;
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
                $http.post('/api/keywords', {keyword: $scope.newKeyword});
                $scope.latestKeyword = $scope.newKeyword;
                $scope.newKeyword = '';
                $location.path('/keyword');
            };

            $scope.deleteKeyword = function (keyword) {
                $http.delete('/api/keywords/' + keyword._id);
            };
            $scope.$on('$destroy', function () {
                socket.unsyncUpdates('keyword');
            });

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
                $http.put('/api/keywords/' + id, {keyword: $scope.editableTitle});
                $scope.disableEditor();
            };
            
            
        });


