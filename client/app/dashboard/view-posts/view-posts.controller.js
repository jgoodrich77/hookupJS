'use strict';

angular
.module('auditpagesApp')
.controller('DashboardViewPostsCtrl', function ($scope, $state, $stateParams, $http, Auth, Time) {

  var endpoint = '/api/user-schedule';

  function getPosts() {
    return $http.get(endpoint + '/posts', {
      params: {
        dateStart: $scope.currentStartDate,
        dateEnd:   $scope.currentEndDate
      }
    })
    .then(function (response) {
      return response.data;
    });
  }

  function loadPosts() {
    $scope.loading = true;
    $scope.posts = false;

    return getPosts()
      .then(function (posts) {
        $scope.posts = posts;
        return posts;
      })
      .finally(function () {
        $scope.loading = false;
      });
  }

  $scope.$on('dashboard-reload', function (evt, currentObject, currentScore) {
    loadPosts();
  });

  if($scope.loadPeriodStateParams($stateParams)) {
    loadPosts();

    var
    currentUserId = Auth.getCurrentUser().id;

    $scope.isFutureDate = function() {
      return Time.isFuture($scope.currentEndDate);
    };

    $scope.cancelScheduledJob = function(record, index) {
      var scope = this;
      $http.delete(endpoint + '/'+record.jobId)
        .then(loadPosts);
    };

    $scope.toggleShowingRecord = function(record) {
      if(!record || !!record.loading) return;

      if(!record.isShowing) {
        record.loading = true;
        record.isShowing = false;

        $http.get(endpoint + '/'+ record.jobId)
          .then(function (response) {
            var userId = (response.data||{data: {}}).data.userId;
            record.loading = false;
            record.isShowing = true;
            record.isUsersJob = (currentUserId === userId);
            record.detail = response.data;
          })
          .finally(function () {
            record.loading = false;
          });
      }
      else {
        record.isShowing = false;
        record.detail = undefined;
      }
    };
  }
});