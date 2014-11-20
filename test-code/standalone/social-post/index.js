'use strict';

var
Q = require('q'),
prompt = require('prompt'),
FbSocialAdapter = require('./lib/facebook-social-adapter');

//
prompt.message = 'Choice for';

var
test = new FbSocialAdapter({
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
