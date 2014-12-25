/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var Q = require('q');
var util = require('util');
var express = require('express');
var mongoose = require('mongoose');
var Agenda = require('agenda');
var config = require('./config/environment');

// Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options);

// Populate DB with sample data
if(config.seedDB) { require('./config/seed'); }

// Setup server
var app = express();
var server = require('http').createServer(app);
var socketio = require('socket.io')(server, {
  serveClient: (config.env === 'production') ? false : true,
  path: '/socket.io-client'
});

var // setup job scheduler
agenda = app.agenda = new Agenda({
  db: {
    address: config.mongo.uri
  }
});

app.use(require('./config/winston.logger'));

require('./jobs')(app);
require('./config/mailer')(app);
require('./config/socketio')(socketio);
require('./config/express')(app);
require('./routes')(app);

// Start server
server.listen(config.port, config.ip, function () {
  console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});

/// Job scheduling

agenda.start();

// process interaction:

function graceful() {
  console.log('Shutting down..');

  agenda.stop(function() {
    console.log('Exited gracefully.');
    process.exit(0);
  });
}

process.on('SIGTERM', graceful);
process.on('SIGINT' , graceful);

//var
// background services
//bgSvcMailerInvitation = require('./components/backgroundService/invitationMailer');

// Expose app
exports = module.exports = app;