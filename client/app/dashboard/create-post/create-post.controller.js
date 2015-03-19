'use strict';

angular
.module('auditpagesApp')
.controller('DashboardCreatePostCtrl', function ($scope, $state, $stateParams, $timeout, $q, $http, $userUpload, $vocabulary, Time) {

  var endpoint = '/api/user-schedule';

  function loadParams() {
    return !!$scope.loadPeriodStateParams($stateParams) ? checkIsPast() : false;
  }

  function checkIsPast(now) {
    now = now||new Date();
    $scope.invalidPeriod = false;

    if(Time.isPast($scope.currentEndDate, now)) {
      $scope.invalidPeriod = true;
      return false;
    }

    return true;
  }

  function validatePost() {
    var post = $scope.post;

    if(!post) return false;

    if(!post.text && !post.link && (!post.media || !post.media.length)) {
      return {
        missingContent: true
      };
    }

    return true;
  }

  function uploadPostFiles() {
    var
    post = $scope.post||{},
    media = post.media||[],
    file = media[0];

    if(!file) return $q.when(true);

    $scope.uploading = true;

    return $userUpload.doUpload(file)
      // .progress(function (evt) { // file upload progress
      //   // console.log('progress:', parseFloat(100.0 * evt.loaded / evt.total), 'file:', file.name);
      // })
      .finally(function(){
        $scope.uploading = false;
      })
      .then(function (det) {
        return det.data;
      });
  }

  function submitPostDetails(uploadInfo) {
    var upload = false;

    if(uploadInfo) {
      upload = uploadInfo._id; // post.media
    }

    var
    post = $scope.post||{};

    return $http.post(endpoint, {
      dates: {
        start: $scope.currentStartDate,
        end:   $scope.currentEndDate
      },
      text:        post.text,
      link:        post.link,
      caption:     post.caption,
      name:        post.name,
      description: post.description,
      media:       upload
    })
    .then(function () {
      $state.go('app.dashboard');
    });
  }

  function submitError(err) {
    console.log('submission error:', err);
    return err;
  }

  // function hasPosts() {
  //   return $http.get(endpoint + '/post-count', {
  //     params: {
  //       dateStart: $scope.currentStartDate,
  //       dateEnd:   $scope.currentEndDate
  //     }
  //   })
  //   .then(function (response) {
  //     return response.data > 0;
  //   });
  // }

  // function reloadPreviousPosts() {
  //   $scope.previousPosts = false;
  //   hasPosts()
  //     .then(function (has) {
  //       $scope.previousPosts = !!has;
  //     });
  // }

  function reloadVocabulary(currentObject) {
    if(!currentObject) return $q.when(false);

    $scope.vocabulary = null;
    $scope.vocabularyLoading = true;
    $scope.vocabularyError = false;

    return $vocabulary.fetchLatest({ id: currentObject.id })
      .then(function (result) {
        $scope.vocabulary = result;

        if(result.loading) {
          $timeout(function(){ reloadVocabulary(currentObject) }, 5000);
        }
      })
      .catch(function (err) {
        $scope.vocabularyError = err;
      })
      .finally(function () {
        $scope.vocabularyLoading = false;
      });
  }

  $scope.$on('dashboard-reload', function (evt, currentObject, currentScore) {
    // reloadPreviousPosts();
    reloadVocabulary(currentObject);
  });

  if( loadParams() ) { // continue loading scope:

    // reloadPreviousPosts();
    reloadVocabulary($scope.currentFbObject);

    $scope.post = {};

    $scope.reRunVocabulary = function () {
      var criteria = { id: $scope.currentFbObject.id };
      $scope.vocabReRunning   = true;
      $scope.rerunError       = null;
      $scope.rerunErrorRemain = null;

      return $vocabulary.reRun(criteria)
        .then(function (results) {
          if(results.error) {
            $scope.rerunError = results.error;
            $scope.rerunErrorRemain = results.msRemaining;
            return false;
          }

          var defer = $q.defer();

          (function recheck(){
            $vocabulary.isRunning(criteria)
              .then(function (result) {
                if(result.isRunning) $timeout(recheck, 5000);
                else return reloadVocabulary($scope.currentFbObject)
                  .then(defer.resolve);
              })
              .catch(defer.reject);
          })();

          return defer.promise;
        })
        .finally(function (results) {
          $scope.vocabReRunning = false;
        })
        .catch(function (err) {
          console.log('got error:', err);
        });
    };

    $scope.submitPost = function() {
      var
      validation = validatePost();

      $scope.validation = false;
      $scope.uploading  = false;
      $scope.submitting = true;

      if(validation !== true) {
        $scope.validation = validation;
        return;
      }

      if($scope.post.media && $scope.post.media.length) { // perform uploads
        return uploadPostFiles()
          .then(submitPostDetails)
          .catch(submitError);
      }
      else {
        return submitPostDetails()
          .catch(submitError);
      }
    };

    $scope.cancelPosting = function() { // back to dashboard
      $state.go('app.dashboard');
    };
  }
});