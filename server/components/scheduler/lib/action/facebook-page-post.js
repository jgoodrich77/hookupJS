'use strict';

var
_ = require('lodash'),
util = require('util'),
Q = require('q'),
Action = require('../action'),
Validation = Action.Validation;

function FacebookPagePostAction() {

  var
  config = _.clone(FacebookPagePostAction.defaultConfig);

  this.configure = function(cfg) {
    if(!cfg) return;
    _.merge(config, cfg);
  };

  this.validate = function() {

    if(!config.fbOwnerToken) return new Validation(false, 'Facebook owner token not specified');
    if(!config.fbPageId)     return new Validation(false, 'Facebook page ID not specified');
    if(!config.post)         return new Validation(false, 'Facebook post details not specified');
    if(!config.post.text)    return new Validation(false, 'Facebook post text is empty');

    return new Validation(true);
  };

  this.run = function() {
    return Q.when(true);
  };

  Action.apply(this, arguments);
}

FacebookPagePostAction.defaultConfig = {
};

util.inherits(FacebookPagePostAction, Action);

module.exports = FacebookPagePostAction;