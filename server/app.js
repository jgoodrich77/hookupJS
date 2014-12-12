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
var config = require('./config/environment');
var facebook = require('./components/facebook');
var facebookScore = require('./components/facebook-score');

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

app.use(require('./config/winston.logger'));

require('./config/mailer')(app);
require('./config/socketio')(socketio);
require('./config/express')(app);
require('./routes')(app);

// Start server
server.listen(config.port, config.ip, function () {
  console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});

facebookScore.checkZombies()
  .then(function (zombies) {
    if(!zombies.length) {
      console.log('Yay, no zombies!');
      return;
    }

    console.log('Found %d zombie(s), re-testing these zombies!', zombies.length);

    Q.allSettled(zombies)
      .then(function (results) {

        var
        hasErrors = results
          .reduce(function (p, c) {
            if(p) return p;
            return c.state === 'rejected';
          }, false);

        console.log('All zombie re-tests are completed%s', !!hasErrors ? ', but with errors:' : '');

        if(hasErrors) {
          results
            .filter(function (v) { return v.state === 'rejected'; })
            .forEach(function (v) {
              console.error('--', util.isError(v.reason) ? v.reason.stack : v.reason);
            });
        }
      });

    return zombies;
  })
  .catch(function (err) {
    console.error('Error while zombie checking:', err);
    return err;
  });

//var
// background services
//bgSvcMailerInvitation = require('./components/backgroundService/invitationMailer');

// Expose app
exports = module.exports = app;