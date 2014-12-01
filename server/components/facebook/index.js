'use strict';

var
FBGraph = require('./lib/graph'),
config = require('../../config/environment');

var
cli = new FBGraph(config.facebookSdk);

module.exports = {
  appInfo: function(accessToken) {
    return cli.get('/app', {
      access_token: accessToken,
      fields: ['id','name','namespace','link'].join(',')
    });
  },
  userInfo: function(accessToken) {

    return cli.get('/me', {
      access_token: accessToken /*,
      fields: ['id','first_name','last_name'].join(',') */
    });
  },
  userObjects: function(accessToken) {
    return cli.getRecursive('/me/accounts', {
      access_token: accessToken,
      limit: 10,
      fields: ['id','access_token','category','name'].join(',')
    });
  },
  post: function(objectId, objectAccessToken, message) {
    return cli.post(path.join('/',objectId,'feed'), {
      access_token: objectAccessToken
    }, {
      message: message
    });
  }
};