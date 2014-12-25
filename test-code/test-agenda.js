'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var
Q = require('q'),
Agenda = require('agenda'),
config = require('../server/config/environment');

var
when = 'in 10 seconds',
agenda = new Agenda({
  db: {
    address: config.mongo.uri
  }
});

agenda.define('post-facebook', function (job, done) {
  console.log(job.attrs.data.time, 'hello world!');
  done();
});

console.log( 'schedule:', agenda.schedule(when, 'post-facebook', {
  time: new Date()
}));

agenda.start();

agenda.on('start', function (job) {
  console.log('Starting Job:', job.attrs.name)
});

agenda.on('complete', function (job) {
  console.log('Completed Job:', job.attrs.name)
});

function graceful() {
  console.log('Shutting down..');

  agenda.stop(function() {
    console.log('Exited gracefully.');
    process.exit(0);
  });
}

process.on('SIGTERM', graceful);
process.on('SIGINT' , graceful);

console.log('Wait..');