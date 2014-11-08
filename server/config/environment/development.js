'use strict';
var winston = require('winston');

// Development specific configuration
// ==================================
module.exports = {
  // MongoDB connection options
  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://localhost/auditpages-dev'
  },

  seedDB: true,

  mailer: {
  },

  expressWinston: {

    transports: [
      new (winston.transports.Console)({
        json: false,
        timestamp: true,
        colorize: true,
        prettyPrint: true,
        level: 'error'
      })
    ]
  },

  log: {
    transports: [
      new (winston.transports.Console)({ json: false, timestamp: true, colorize: true, prettyPrint: true, level: 'info' })
    ],

    exceptionHandlers: [
      new (winston.transports.Console)({ json: false, timestamp: true, colorize: true, prettyPrint: true })
    ],

    exitOnError: false
  }
};
