'use strict';

var
util = require('util');

function Logger(verbose) {

  function output(tag, args) {

    var
    str = util.format('[%s]', tag),
    aargs = Array.prototype.slice.call(args, 0);

    if(typeof aargs[0] === 'string') { // prepend our formatted tag
      aargs[0] = str + ' ' + aargs[0];
    }
    else { // prepend as an argument
      aargs.unshift(str);
    }

    console.log.apply(console, aargs);
  }

  this.isVerbose = function() {
    return !!verbose;
  };

  this.debug = function() {
    if(verbose) {
      output('debug', arguments);
    }

    return this;
  };

  this.info = function() {
    output('info', arguments);
    return this;
  };

  this.warn = function() {
    output('warn', arguments);
    return this;
  };

  this.error = function() {
    output('derror', arguments);
    return this;
  };
}

module.exports = Logger;