'use strict';

angular
.module('auditpagesApp')
.filter('schedulerRecordLabel', function (Time) {
  return function (recordSet, period, day) {
    var isCurrentPeriod = Time.isPast(period.start) && Time.isFuture(period.end);

    if(recordSet.length === 0) {
      var glyphicon = '';

      if(isCurrentPeriod) {
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