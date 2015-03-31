'use strict';

var
Q = require('q'),
User = require('../../api/user/user.model'),
facebook = require('../../components/facebook');

function qLoadUserObjectInfo(userId, objectId) {
  var userToken, pageToken, foundInfo = false;

  return Q.nfcall(User.findById.bind(User), userId)
    .then(function (doc) {
      if(!doc)
        throw new Error('Could not find user.');

      if(!doc.facebook || !doc.facebook.token)
        throw new Error('User has no facebook token set.');

      userToken = doc.facebook.token;

      // load accounts that belong to this user token
      return facebook.userObjects(userToken);
    })
    .then(function (userObjects) {

      if(!userObjects || !userObjects.length)
        throw new Error('Unable to load any user objects, possibly a bad user token.');

      // find user's page object (to get token)
      userObjects.every(function (v) {

        if(v.id === objectId) {
          foundInfo = v;
          return false;
        }

        return true;
      });

      if(!foundInfo)
        throw new Error('Could not find user object in accounts.');

      return {
        ownerToken: userToken,
        pageToken: foundInfo.access_token
      };
    });
}

module.exports = qLoadUserObjectInfo;