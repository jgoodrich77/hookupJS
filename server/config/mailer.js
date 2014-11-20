'use strict';

var nodemailer = require('nodemailer'),
  sesTransport = require('nodemailer-ses-transport'),
  config  = require('./environment');

module.exports = function (app) {
  app.use(function (req, res, next) { // install into app
    res.mailer = nodemailer.createTransport(sesTransport(config.mailer));
    next();
  });
};