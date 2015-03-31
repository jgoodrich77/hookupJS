var
_ = require('lodash'),
pubDefaults = require('./default.public.js');

module.exports = _.merge({}, pubDefaults, {
  version: pubDefaults.version + '-beta',
  facebookAppId: process.env.FB_APP_ID || '1545240202414896',
  googleAnalyticsId: process.env.GA_ID || 'UA-59730313-2'
});