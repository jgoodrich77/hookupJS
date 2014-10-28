'use strict';

angular.module('auditpagesApp')
  .controller('KeywordCtrl', function ($scope, $http, socket) {
    $scope.awesomeKeywords = [];

    $http.get('/api/keywords').success(function(awesomeKeywords) {
      $scope.awesomeKeywords = awesomeKeywords;
      socket.syncUpdates('keyword', $scope.awesomeKeywords);
    });

    $scope.addKeyword = function() {
      if($scope.newKeyword === '') {
        return;
      }
      $http.post('/api/keywords', { name: $scope.newKeyword });
      $scope.newKeyword = '';
    };

    $scope.deleteKeyword = function(keyword) {
      $http.delete('/api/keywordss/' + keyword._id);
    };

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('keyword');
    });
  });
