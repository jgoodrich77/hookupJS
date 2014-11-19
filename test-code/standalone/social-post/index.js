'use strict';

var
_ = require('lodash'),
Q = require('q'),
path = require('path'),
prompt = require('prompt'),
util = require('util'),
FB = require('./lib/facebook-adapter.js');

//
prompt.message = 'Choice for';

function SocialAdapterAbstract(adapterInterface) {
  var noopFalse = function() {
    return false;
  };

  _.extend(this, { // default interface constructors
    appInfo: noopFalse,
    userInfo: noopFalse
  });

  // overwrite with adapter inferface
  _.extend(this, adapterInterface);
}

function FacebookAdapter(cliConfig) {
  var
  cli = new FB(cliConfig),
  errorHandler = function() {
    return function (error) {
    };
  };

  SocialAdapterAbstract.call(this, {
    appInfo: function() {
      /* Example Data: {
        "id": "1508937439378506",
        "daily_active_users": "0",
        "daily_active_users_rank": 0,
        "icon_url": "https://fbstatic-a.akamaihd.net/rsrc.php/v2/yE/r/7Sq7wKJHi_5.png",
        "link": "http://www.hookupjs.com/",
        "logo_url": "https://fbcdn-photos-c-a.akamaihd.net/hphotos-ak-xpa1/t39.2081-0/p75x75/851578_455087414601994_1601110696_n.png",
        "mobile_web_url": "http://www.hookupjs.com/",
        "monthly_active_users": "0",
        "monthly_active_users_rank": 0,
        "name": "hookupjs",
        "namespace": "hookupjs_one_alpha",
        "weekly_active_users": "0"
      } */
      return cli.get('/app', {
        fields: ['id','name','namespace','link'].join(',')
      });
    },
    userInfo: function() {
      /* Example Data: {
        "id": "10153031522099245",
        "about": "Practice makes champions.",
        "first_name": "Hans",
        "gender": "male",
        "last_name": "Doller",
        "link": "https://www.facebook.com/app_scoped_user_id/10153031522099245/",
        "locale": "en_US",
        "name": "Hans Doller",
        "timezone": -6,
        "updated_time": "2014-06-13T21:05:53+0000",
        "verified": true
      } */
      return cli.get('/me', {
        fields: ['id','first_name','last_name'].join(',')
      });
    },
    userObjects: function() {
      /* Example Data: [{
        "id": "162373397120761",
        "category": "Artist",
        "name": "Dreamscapes",
        "access_token": "--- access token here ---",
        "perms": [
          "ADMINISTER",
          "EDIT_PROFILE",
          "CREATE_CONTENT",
          "MODERATE_CONTENT",
          "CREATE_ADS",
          "BASIC_ADMIN"
        ]
      }, ... ] */
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

util.inherits(FacebookAdapter, SocialAdapterAbstract);

var
test = new FacebookAdapter({
  appId:       process.env.FB_APP_ID       || '-- invalid app id --',
  appSecret:   process.env.FB_APP_SECRET   || '-- invalid app secret --',
  accessToken: process.env.FB_ACCESS_TOKEN || '-- invalid token --'
});

console.log('Please wait, connecting to FB and pulling data..');

[
  function (buffer) { // get information about the app:
    return test.appInfo()
      .then(function (appInfo) {
        buffer.appInfo = appInfo;
        return buffer;
      });
  },
  function (buffer) { // get information about the current user of the token:
    return test.userInfo()
      .then(function (userInfo) {
        buffer.userInfo = userInfo;
        return buffer;
      });
  },
  function (buffer) { // get information about the current user of the token:
    return test.userObjects()
      .then(function (userObjects) {
        buffer.userObjects = userObjects;
        return buffer;
      });
  }
] .reduce(Q.when, Q({}))
  .then(function (result) { // do introduction..
    var defer = Q.defer();
    //console.log('(%s) %s', typeof result, JSON.stringify(result, null, 2));

    console.log('\nHello %s %s, Welcome to %s.\n', result.userInfo.first_name, result.userInfo.last_name, result.appInfo.name);

    if(!result.userObjects.length) {
      console.log('Seems like there are no pages associated with this account. Maybe you did not allow us the manage_pages permission?');
      return;
    }

    console.log('Which page do you want to test?\n');

    result.userObjects.forEach(function (pageObject, index) {
      console.log(' %d) %s [category: %s]', index + 1, pageObject.name, pageObject.category);
    });

    console.log();

    prompt.start();
    prompt.get([{
      name: 'page',
      description: 'Page number',
      type: 'number',
      required: true,
      default: 1,
      message: 'Invalid page number was supplied.',
      conform: function(v) {
        var vAsInt = parseInt(v);
        return vAsInt > 0 && vAsInt <= result.userObjects.length;
      }
    }], function (err, choice) {
      if(err) {
        return defer.reject(err);
      }

      var
      page = result.userObjects[choice.page - 1];

      console.log('You answered:', page.name, '. Spamming your page! lol, jk..');

      return test
        .post(page.id, page.access_token, 'This is a test, please ignore!')
        .then(defer.resolve)
        .catch(defer.reject);
    });

    return defer.promise;
  })
  .then(function (postResult) { //
    var postId = postResult.id;

    console.log('Post was successful, ID was (%s)', postId);

    return postResult;
  })
  .catch(function (err) {
    console.error(err.stack || 'Error: ' + err);
  });
