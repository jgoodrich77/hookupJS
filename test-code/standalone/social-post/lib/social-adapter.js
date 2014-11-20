'use strict';

var
Q = require('q'),
_ = require('lodash');

function SocialAdapter(adapterInterface) {
  var noopFalse = function() {
    return Q(false);
  };

  _.extend(this, { // default interface constructors
    appInfo: noopFalse,
    userInfo: noopFalse,
    userObjects: noopFalse,
    post: noopFalse
  });

  // overwrite with adapter inferface
  _.extend(this, adapterInterface);
}

module.exports = SocialAdapter;