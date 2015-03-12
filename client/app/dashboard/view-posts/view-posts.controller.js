'use strict';

angular
.module('auditpagesApp')
.controller('DashboardViewPostsCtrl', function ($scope, $q, $fb, $state, $stateParams, $http, Auth, Time) {

  var
  endpoint = '/api/user-schedule',
  currentFbObjectId,
  currentFbObjectToken;

  var
  promisesObj = {},
  promisesLikes = {};

  function getObjectInfo(oid) {
    if(promisesObj.hasOwnProperty(oid)) return promisesObj[oid];
    var fields = [
      'id',
      'message',
      'picture',
      'link',
      'icon',
      'type',
      'status_type',
      'created_time',
      'updated_time',
      'shares',
      'likes.summary(true).filter(stream)',
      'comments.summary(true).filter(stream)'
    ];
    promisesObj[oid] = $fb.getObjectInfo({
      id: oid,
      access_token: currentFbObjectToken
    }, fields).then(function (response) {
      promisesObj[oid] = response;
      return;
    });
    return promisesObj[oid];
  }

  function getObjectLikes(oid) {
    if(promisesLikes.hasOwnProperty(oid)) return promisesLikes[oid];
    promisesLikes[oid] = $fb.getObjectLikes({
      id: oid,
      access_token: currentFbObjectToken
    }).then(function (response) {
      promisesLikes[oid] = response;
      return;
    });
    return promisesLikes[oid];
  }

  function getPostsPending() {
    return $http.get(endpoint + '/posts-pending', {
      params: {
        dateStart: $scope.currentStartDate,
        dateEnd:   $scope.currentEndDate
      }
    })
    .then(function (response) {
      return response.data;
    });
  }

  function getFacebookPosts() {
    if(!currentFbObjectId || !currentFbObjectToken)
      return $q.when(false);

    return $fb.getObjectPosts({
      id: currentFbObjectId,
      access_token: currentFbObjectToken
    }, $scope.currentStartDate, $scope.currentEndDate) //, ['id', 'updated_time', 'created_time', 'status_type', 'type']
      .then(function (results) {
        return results.data;
      });
  }

  function loadPosts() {
    $scope.loading = true;
    $scope.postsPending = [];
    $scope.postsPublished = [];

    return getPostsPending()
      .then(function (posts) {
        Array.prototype.push.apply($scope.postsPending, posts);
        return getFacebookPosts();
      })
      .then(function (fbPosts) {
        if(!fbPosts) return false;
        Array.prototype.push.apply($scope.postsPublished, fbPosts);
        return $scope.posts;
      })
      .finally(function () {
        $scope.loading = false;
      });
  }

  function loadPostsAndObject(currentObject) {
    currentObject = currentObject || $scope.currentFbObject;
    return $fb.getObjectIdToken(currentObject.id)
      .then(function (token) {
        if(!token) {
          $scope.fbObjectError  = 'No token could be found for page.';
          return;
        }

        currentFbObjectId = currentObject.id;
        currentFbObjectToken = token;

        loadPosts();
      });
  }

  $scope.$on('dashboard-reload', function (evt, currentObject, currentScore) {
    loadPostsAndObject(currentObject);
  });

  if($scope.loadPeriodStateParams($stateParams)) {

    if(!$scope.fullLoading) {
      loadPostsAndObject();
    }

    var
    currentUserId = Auth.getCurrentUser().id;

    $scope.getObjectInfo = getObjectInfo;
    $scope.getObjectLikes = getObjectLikes;

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