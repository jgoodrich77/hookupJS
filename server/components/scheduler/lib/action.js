'use strict';

var
util = require('util'),
path = require('path'),
Q = require('q');

function Action(opts) {
  this.configure = this.configure || function(cfg) {
  };
  this.validate = this.validate || function() {
    return new Action.Validation(false, 'Validator is not implemented');
  };
  this.run = this.run || function() {
    return Q.when(this.validate());
  };
  this.configure(opts);
}

Action.Validation = function(passes, failReason) {
  this.isValid = function(){
    return !!passes;
  };
  this.getReason = function() {
    return failReason;
  };
};

Action.factory = function(type, opts) {

  var
  action = require( path.join(__dirname, 'action', type) );

  return new action(opts);
};

module.exports = Action;