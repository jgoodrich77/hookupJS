'use strict';

var path = require('path');
var winston = require('winston');
var _ = require('lodash');
var os = require('os');

function requiredProcessEnv(name) {
  if(!process.env[name]) {
    throw new Error('You must set the ' + name + ' environment variable');
  }
  return process.env[name];
}

// All configurations will extend these options
// ============================================
var
baseDir = path.normalize(__dirname + '/../../..'),
all = {
  env: process.env.NODE_ENV,

  // Root path of server
  root: baseDir,

  // Server port
  port: process.env.PORT || 3000,

  // Should we populate the DB with sample data?
  seedDB: false,

  // Secret for session, you will want to change this and make it an environment variable
  secrets: {
    session: 'auditpages-secret'
  },

  sessionDuration: 300,

  publicUrl: process.env.HOOKUP_URL || 'http://localhost',

  inviteService: {
    fromEmail: process.env.HOOKUP_AWS_SENDER || 'HookupJS <no-reply-invited@hookupjs.com>',
    subject: 'You were invited!',
    checkInterval: 10000
  },

  // List of user roles
  userRoles: ['guest', 'user', 'admin'],

  facebookSdk: {
    appId:       process.env.FB_APP_ID       || '-- invalid app id --',
    appSecret:   process.env.FB_APP_SECRET   || '-- invalid app secret --'
  },

  // MongoDB connection options
  mongo: {
    options: {
      db: {
        safe: true
      }
    }
  },

  uploads: {
    saveDir: path.join(baseDir, 'uploads'),
    route: 'api/user-uploads',
    routeCdn: 'cdn'
  },

  mailer: {
    region: process.env.HOOKUP_AWS_REGION || 'us-east-1',
    accessKeyId: process.env.HOOKUP_AWS_ACCESSKEYID || 'INVALIDAWSACCESSKEY',
    secretAccessKey: process.env.HOOKUP_AWS_KEYSECRET || 'INVALID/AWS/Secret/key',
    rateLimit: 1 // do not send more than 1 message in a second
  },

  expressWinston: {

    transports: [
      new (winston.transports.Console)({
        json: false,
        timestamp: true
      })
    ],

    dumpExceptions: true,
    showStack: true,

    meta: false, // optional: control whether you want to log the meta data about the request (default to true)
    msg: "HTTP {{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
  },

  log: {
    transports: [],
    exceptionHandlers: [],
    exitOnError: false
  }
};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = _.merge(
  all,
  require('./' + process.env.NODE_ENV + '.js') || {});
