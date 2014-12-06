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
  userInfo: function(userId, accessToken) {
    return cli.get(userId, {
      access_token: accessToken
    });
  },
  userObjects: function(accessToken) {
    return cli.getRecursive('/me/accounts', {
      access_token: accessToken,
      limit: 10,
      fields: ['id','access_token','category','name'].join(',')
    });
  },
  pageInfo: function(pageId, accessToken) {
    return cli.get(pageId, {
      access_token: accessToken
    });
  },
  basicPageInfo: function(pageId, accessToken) {
    return cli.get(pageId, {
      access_token: accessToken,
      fields: ['id','name','likes','new_like_count','link','website','description'].join(',')
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