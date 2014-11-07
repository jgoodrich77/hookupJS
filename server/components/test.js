'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var
express  = require('express'),
mongoose = require('mongoose'),
config   = require('../config/environment');

var
Services = require('./service');

var
fbPage = Services.getByType('facebook-page');

try {
  mongoose.connect(config.mongo.uri, config.mongo.options);
  // fbPage.doSomething();
}
catch(e) {
  console.error(e);
}
finally {
  mongoose.disconnect();
}