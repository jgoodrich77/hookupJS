'use strict';

angular
.module('auditpagesApp')
.filter('schedulerRecordLabel', function () {
  return function (recordSet, period, day) {

    // var endTime = Time.parse(period.end).toDate(day);

    if(recordSet.length === 0) {
      // var glyphicon = 'glyphicon-ban-circle';

      // if(!Time.isPast(endTime, new Date)) {
      //   glyphicon = 'glyphicon-plus';
      // }

      // return '<span class="glyphicon '+ glyphicon +'"></span>';
      return '&nbsp;';
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