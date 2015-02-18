'use strict';

angular
.module('auditpagesApp')
.filter('schedulerRecordLabel', function (Time) {
  return function (recordSet, period, day) {

    var
    startTime = Time.parse(period.start).toDate(day),
    endTime = Time.parse(period.end).toDate(day);

    if(recordSet.length === 0) {
      var glyphicon = '';

      if(Time.isPast(startTime, new Date) && Time.isFuture(endTime, new Date)) {
        glyphicon = 'glyphicon glyphicon-plus';
      }

      if(glyphicon !== '') {
        return '<span class="'+ glyphicon +'"></span>';
      }
      else {
        return '&nbsp;';
      }
    }

    return recordSet.length;
  }
})
.filter('schedulerPeriod', function (Time) {
  return function (period) {
    var
    sT = Time.parse(period.start),
    eT = Time.parse(period.end);

    return sT.get12Hr(true) + ' - ' + (eT.get12Hr() + ':' + eT.getMinutes(true) + eT.getAmPm());
  }
});