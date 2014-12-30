'use strict';

angular
.module('auditpagesApp')
.filter('schedulerRecordLabel', function () {
  return function (recordSet) {
    return recordSet.length;
  }
})
.filter('schedulerPeriod', function (Time) {
  return function (period) {
    var
    sT = Time.parse(period.start),
    eT = Time.parse(period.end);

    return sT.get12Hr() + ' - ' + eT.get12Hr();
  }
});