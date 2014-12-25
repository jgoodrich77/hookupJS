'use strict';

var
_ = require('lodash'),
mongoose = require('mongoose'),
UserJob = require('./job.model');

exports.index = function(req, res, next) { // all jobs for user:
  UserJob.findDetailedByUser(res.agenda, req.user._id, function (err, jobs) {
    if(err) return next(err);
    return res.json(200, jobs);
  });
};

exports.show  = function(req, res, next) { // show detailed information about a user's job:
  UserJob.findOne({ userId: req.user._id, jobId: req.params.id }, 'jobId', function (err, job) {
    if(err) return next(err);
    if(!job) return res.send(404);

    UserJob.findDetailedById(res.agenda, job.jobId, function (err, jobDetail) {
      if(err) return next(err);
      if(!jobDetail) return res.send(404);
      res.json(200, jobDetail);
    });
  });
};

exports.destroy  = function(req, res, next) { // cancel an existing user job
  var jobId = req.params.id;

  UserJob.cancelUserJob(res.agenda, req.user._id, jobId, function (err, removed) {
    if(err) return next(err);
    if(removed === 0) {
      console.log('Job ID (%s) did not match any jobs in agenda.', jobId);
      return res.send(404);
    }
    else if(removed === undefined) {
      console.log('Job ID (%s) did not match any jobs in user job collection.', jobId);
      return res.send(404);
    }

    return res.send(204);
  });
};

exports.create  = function(req, res, next) { // create a new user job

  var
  userId  = req.user._id,
  options = req.body.options;

  if(!options.type || !options.schedule) {
    return res.send(401);
  }

  var type = options.type;
  var schedule = options.schedule;

  delete options.type;
  delete options.schedule;

  UserJob.createJob(res.agenda, userId, type, options, schedule, function (err, job) {
    if(err) return next(err);
    res.json(200, job);
  });
};