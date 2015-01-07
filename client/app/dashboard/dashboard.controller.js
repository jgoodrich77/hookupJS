'use strict';

angular
.module('auditpagesApp')
.controller('DashboardCtrl', function ($scope, $http, $fb, $interval, $userUpload, Modal, Time, Scheduler, ScheduleData, SchedulePlan) {

  var
  endpoint = '/api/user-schedule',
  dates = SchedulePlan.localWeekDates(0),
  dateLen = dates.length,
  plan = new SchedulePlan([
      { name: 'Morning', periods: [
        { start: '05:00', end: '07:59:59.999' },
        { start: '08:00', end: '09:59:59.999' },
        { start: '10:00', end: '11:59:59.999' }
      ] },
      { name: 'Afternoon', periods: [
        { start: '12:00', end: '14:59:59.999' },
        { start: '15:00', end: '16:59:59.999' },
        { start: '17:00', end: '18:59:59.999' }
      ] },
      { name: 'Evening', periods: [
        { start: '19:00', end: '20:59:59.999' },
        { start: '21:00', end: '23:59:59.999' },
        { start: '00:00', end: '04:59:59.999' }
      ] }
    ], dates),
  data = new ScheduleData(plan, {
    rowDateProperty: 'scheduledFor',
    loader: new ScheduleData.LoaderHttp({
      method: 'GET',
      url: endpoint
    })
  });

  // $userUpload.query().$promise
  //   .then(function (result) {
  //     console.log('uploads:', result);
  //   });

  $scope.scheduler = new Scheduler(plan, data, {
    minDate: new Date(new Date(dates[0]).getTime() - (8.64e7 * dateLen * 8)),
    maxDate: new Date(new Date(dates[dateLen - 1]).getTime() + (8.64e7 * dateLen)),
    autoLoad: true
  });

  $interval(function(){}, 2500);

  $scope.adding    = false;
  $scope.uploading = false;

  $scope.itemClick = function(period, date, records) {
    var
    now = new Date,
    pStartDate = Time.parse(period.start).toDate(date),
    pEndDate   = Time.parse(period.end).toDate(date),

    pStartDateIsPast = Time.isPast(pStartDate, now),
    pEndDateIsPast   = Time.isPast(pEndDate, now),

    isPast    = (pStartDateIsPast && pEndDateIsPast),
    isPresent = (pStartDateIsPast && !pEndDateIsPast),
    isFuture  = (!pStartDateIsPast && !pEndDateIsPast);

    if(isPresent || isFuture) {
      var
      submitPost = function(formData, media) {

        var
        date   = formData.date,
        period = formData.period;

        return $http.post(endpoint, {
          dates: {
            start: Time.parse(period.start).toDate(date),
            end:   Time.parse(period.end).toDate(date)
          },
          text:        formData.text,
          link:        formData.link,
          caption:     formData.caption,
          name:        formData.name,
          description: formData.description,
          media:       media
        }).success(function (response) {
            console.log('Posted successfully', response);
            return response;
          })
          .error(function (err) {
            console.log('Error!', err);
            return err;
          });
      },
      onPost = function() {
        data.reload();
        $scope.adding = false;
      },
      onAdd = function (result) {
        if(!result.text && !result.media) { // criteria did not pass validation
          return addFn(date, period, records, {
            missingDetails: true
          });
        }

        $scope.adding    = true;
        $scope.uploading = false;

        // upload media separatly if any
        if(!!result.media && !!result.media.length) {
          $scope.uploading = true;

          var file = result.media[0];

          $scope.upload = $userUpload.doUpload(file)
            .progress(function (evt) { // file upload progress
              console.log('progress:', parseFloat(100.0 * evt.loaded / evt.total), 'file:', file.name);
            })
            .success(function (res) { // file is uploaded successfully
              console.log('file', file.name, 'is uploaded successfully. Response:', res);
              return submitPost(result, res._id);
            })
            .error(function () { // file upload failed
              console.log('file upload failed', arguments);
            })
            .then(onPost)
            .finally(function(){
              $scope.uploading = false;
            });
        }
        else {
          submitPost(result, false)
            .then(onPost);
        }

        return;
      },
      addFn = Modal.scheduleAdd(onAdd);
      addFn(date, period, records);
    }
    else {

    }
  };
  $scope.itemClasses = function(period, date, records) {
    var
    now = new Date,
    pStartDate = Time.parse(period.start).toDate(date),
    pEndDate   = Time.parse(period.end).toDate(date),
    isSameDay  = Time.isSameDay(date, now);

    return {
      'current':  isSameDay,
      'disabled': false,
      'negative': Time.isPast(pEndDate, now) && !records.length,
      'positive': !!records.length,
      'neutral':  Time.isFuture(pStartDate, now)
    };
  };
});
