'use strict';

var
path = require('path'),
util = require('util'),
FBGraph = require('./facebook-graph'),
SocialAdapter = require('./social-adapter');

function FacebookSocialAdapter(cliConfig) {
  var
  cli = new FBGraph(cliConfig);

  SocialAdapter.call(this, {
    appInfo: function() {
      return cli.get('/app', {
        fields: ['id','name','namespace','link'].join(',')
      });
    },
    userInfo: function() {
      return cli.get('/me', {
        fields: ['id','first_name','last_name'].join(',')
      });
    },
    userObjects: function() {
      return cli.getRecursive('/me/accounts', {
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
  });
}

util.inherits(FacebookSocialAdapter, SocialAdapter);

module.exports = FacebookSocialAdapter;