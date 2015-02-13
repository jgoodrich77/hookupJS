var
_ = require('lodash'),
localConfig;

try {
  localConfig = require('../local.env');
} catch(e) {
  localConfig = {};
}

module.exports = {
  version: '0.3',
  facebookAppId: process.env.FB_APP_ID || '1508937439378506',
  googleAnalyticsId: process.env.GA_ID || 'UA-59730313-1'
};