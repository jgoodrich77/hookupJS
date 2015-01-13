'use strict';

var
_ = require('lodash'),
mongoose = require('mongoose'),
UserSchedule = require('./schedule.model'),
Time = require('../../../components/utils/time');

function adjustForTimezone(date, offset) {
  offset = (offset === undefined) ? (new Date).getTimezoneOffset() : parseInt(offset);

  if(isNaN(offset)) {
    return false;
  }

  var
  nDate = new Date(date),
  tzDiff = ((nDate.getTimezoneOffset() - offset) * 60000);
  nDate.setTime(nDate.getTime() - tzDiff);
  return nDate;
}

exports.index = function(req, res, next) {
  var
  year = parseInt(req.query.year),
  week = parseInt(req.query.weekNumber);

  if(isNaN(year) || isNaN(week) || (week < 1)) return next(new Error('Invalid date was provided in query.'));

  // find the current user's fb group id:
  UserSchedule.findByObjectYearWeek(req.user.facebookObj.id, year, week, function (err, data) {
    if(err) return next(err);
    res.json(data);
  });
};

exports.create  = function(req, res, next) {
  var
  reqData = req.body,
  dates   = reqData.dates,
  sDate   = new Date(dates.start),
  eDate   = new Date(dates.end),
  data    = {
    userId: req.user._id,
    facebookObjectId: req.user.facebookObj.id,
    text: reqData.text || false,
    link: reqData.link || false,
    media: reqData.media || false,
    caption: reqData.caption || false,
    name: reqData.name || false,
    description: reqData.description || false
  };

  // check the incoming data:
  if(!sDate || !eDate) {
    return res.send(401, 'Invalid time period was provided.');
  }

  // check the incoming data:
  if(!data.text && !data.link && !data.media) {
    return res.send(401, 'No post information was provided');
  }

  // check the incoming date:
  if(eDate.getTime() < Date.now()) {
    return res.send(401, 'Can not schedule past dates.');
  }

  // find optimal posting time
  UserSchedule.findNextSlot(req.user._id, sDate, eDate, function (err, optimalTime) {
    if(err) return next(err);

    if(!optimalTime) {
      return res.send(401, 'No time slot available in the requested period.');
    }

    UserSchedule.createJob(res.agenda, req.user._id, 'facebook-page-post', data, optimalTime, function (err, job) {
      if(err) return next(err);
      res.json(200, job);
    });
  });
};

exports.show  = function(req, res, next) {
  UserSchedule.findDetail(res.agenda, req.user._id, req.params.id, function (err, job) {
    if(err) return next(err);
    res.json(200, job);
  });
};

exports.destroy  = function(req, res, next) {
  UserSchedule.cancelJob(res.agenda, req.user._id, req.params.id, function (err, cancelledCount) {
    if(err) return next(err);
    if(!cancelledCount) return res.send(404);
    res.send(200);
  });
};