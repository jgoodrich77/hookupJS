'use strict';

angular
.module('auditpagesApp')
.service('$week', function() {
  var
  MS_PER_DAY = 8.64e7,
  DAY_PER_WEEK = 7,
  DEFAULT_BOW = 0; // sunday

  function dateWeek(date) {
    // ...
  }

  function dateRange(year, weekNumber, boW) {
    boW = isNaN(boW) ? DEFAULT_BOW : boW;

    if(weekNumber < 1) weekNumber = 1;

    var now = new Date(year, 0, 1);

    now.setHours(0,0,0);
    now.setDate(now.getDate()+boW-(now.getDay()||DAY_PER_WEEK));
    now.setTime(now.getTime() + (MS_PER_DAY * DAY_PER_WEEK * (weekNumber - 1)));

    return {
      start: now,
      end:   new Date(now.getTime() + ((MS_PER_DAY * DAY_PER_WEEK) - 1))
    }
  }

  return {
    dateWeek: dateWeek,
    dateRange: dateRange
  };
});
