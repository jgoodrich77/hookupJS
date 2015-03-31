'use strict';

var
Q = require('q'),
util = require('util'),
fs = require('fs'),
path = require('path');

var dirStartup = path.join(__dirname, 'startup');
var dirManual  = path.join(__dirname, 'manual');

function loadDir(agenda, dir, runImmediately) {
  var defer = Q.defer();

  // load all start-up jobs (not included into available):
  fs.readdir(dir, function (err, files) {
    if(err){
      return defer.reject(err);
    }

    var defined = [];

    files.forEach(function (f) {

      var
      fullpath = path.join(dir, f),
      ext      = path.extname(fullpath)||'',
      basename;

      if(ext.toLowerCase() !== '.js') {
        return; // skip
      }

      basename = path.basename(fullpath, ext);

      var jobFunction = require(fullpath);

      if(typeof jobFunction !== 'function') { // not a job function
        return;
      }

      agenda.define(basename, jobFunction);
      defined.push(basename);
    });

    return defer.resolve(defined);
  });

  return defer.promise;
}

function JobManager(app) {
  var
  me = this,
  agenda = app.agenda;
  console.log('Job manager initializing..');

  if(app.jobManager) { // prevent double loading
    return app.jobManager;
  }

  // load all start-up jobs (not included into available):
  loadDir(agenda, dirStartup, true)
    .then(function (loadedStartup) {
      console.log('Start-up jobs:', loadedStartup);

      loadedStartup.forEach(function (jobName) {
        agenda.now(jobName);
      });

      // now load all manual jobs:
      return loadDir(agenda, dirManual);
    })
    .then(function (loadedManual) {
      console.log('Manual jobs:', loadedManual);
      JobManager.available = JobManager.available.concat(loadedManual);

      return JobManager.available;
    })
    .catch(function (err) {
      console.error('Problem loading jobs:', err);
    });

  // install references to this configured job manager in app requests:
  app.use(function (req, res, next) {
    req.validJobs = JobManager.available;

    req.isValidJob = function(jobName) {
      return req.validJobs.indexOf(jobName) !== -1;
    };

    res.agenda = agenda; // reference directly to agenda (for possible later reuse)
    res.scheduleJob    = agenda.schedule.bind(agenda);
    res.runJob         = agenda.now.bind(agenda);
    res.incrementalJob = agenda.every.bind(agenda);

    next();
  });

  function timestamp() {
    return (new Date).toISOString();
  };

  agenda.on('start', function (job) {
    console.log('[%s] starting Job (%s:%s)..', timestamp(), job.attrs._id, job.attrs.name)
  });

  agenda.on('complete', function (job) {
    console.log('[%s] completed Job (%s:%s): %j', timestamp(), job.attrs._id, job.attrs.name, job.attrs.data)
  });

  app.jobManager = this;
};

JobManager.available = [];

module.exports = JobManager;