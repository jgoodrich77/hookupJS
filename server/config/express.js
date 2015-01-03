/**
 * Express configuration
 */

'use strict';

var express = require('express');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var compression = require('compression');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var errorHandler = require('errorhandler');
var path = require('path');
var config = require('./environment');
var session = require('express-session');
var mongoStore = require('connect-mongo')(session);
var mongoose = require('mongoose');
var busboy = require('connect-busboy');

module.exports = function (app) {
  var
  env = app.get('env'),
  isProduction = ('production' === env),
  isDevelopment = ('development' === env || 'test' === env);

  app.set('views', config.root + '/server/views');
  app.engine('html', require('ejs').renderFile);
  app.set('view engine', 'html');
  app.use(compression());

  if (isProduction) {
    app.use(favicon(path.join(config.root, 'public', 'favicon.ico')));
    app.use(express.static(path.join(config.root, 'public')));
  }
  else if (isDevelopment) {
    app.use(require('connect-livereload')());
    app.use(express.static(path.join(config.root, '.tmp')));
    app.use(express.static(path.join(config.root, 'client')));
  }

  // use busbou instead of bodyParser for file uploading, and parsing JSON.
  app.use(busboy({
    highWaterMark: 2 * 1024 * 1024,
    limits: {
      fileSize: 10 * 1024 * 1024
    }
  }));
  app.use(bodyParser.json());
  app.use(methodOverride());
  app.use(cookieParser());

  // Persist sessions with mongoStore
  // We need to enable sessions for passport twitter because its an oauth 1.0 strategy
  app.use(session({
    secret: config.secrets.session,
    resave: true,
    saveUninitialized: true,
    store: new mongoStore({ mongoose_connection: mongoose.connection })
  }));

  app.use(function (req, res, next) {
    if (req.busboy) {
      req.files = {};
      req.busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        req.files[fieldname] = {
          file: file,
          filename: filename,
          encoding: encoding,
          mimeType: mimetype
        };
        next();
      });
      req.pipe(req.busboy);
    }
    else {
      next();
    }
  });

  if (isProduction) {
    app.set('appPath', config.root + '/public');
    app.use(morgan('dev'));
  }
  else if (isDevelopment) {
    app.set('appPath', 'client');
    app.use(morgan('dev'));
    app.use(errorHandler()); // Error handler - has to be last
  }
};