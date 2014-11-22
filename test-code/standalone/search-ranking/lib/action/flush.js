'use strict';

var // local libs
util = require('util'),
Q = require('q'),
config = require('../config');

var // models we require
modelKeyword      = require('../model/keyword'),
modelKeywordCheck = require('../model/keyword-check');

function ActionFlush(opts, log) {

  function flushKeywords(buffer) {

    var defer = Q.defer();

    modelKeyword
      .find({})
      .remove(function (err, removed)  {
        if(err) {
          return defer.reject(err);
        }

        log.debug('Removed %d keyword(s)..', removed);

        buffer.keywords = removed;
        defer.resolve(buffer);
      });

    return defer.promise;
  }
  function flushKeywordChecks(buffer) {

    var
    defer = Q.defer();

    modelKeywordCheck
      .find({})
      .remove(function (err, removed)  {
        if(err) {
          return defer.reject(err);
        }

        log.debug('Removed %d keyword check(s)..', removed);

        buffer.checks = removed;
        defer.resolve(buffer);
      });

    return defer.promise;
  }

  this.run = function () {

    var
    chain = Q({});

    if(opts.all) {
      log.info('Flushing ALL data!');
      chain = chain
        .then(flushKeywords)
        .then(flushKeywordChecks);
    }
    else {

      if(opts.keywords) {
        log.info('Flushing keywords, and associated check data.');

        chain = chain
          .then(flushKeywords)
          .then(flushKeywordChecks);
      }
      else if(opts.checks) {
        log.info('Flushing keyword check data only.');

        chain = chain
          .then(flushKeywordChecks);
      }
    }

    return chain
      .then(function (result) {
        log.debug('Flush finished');
        return result;
      });
  };
}

ActionFlush.minimistOpts = {
  boolean: ['all', 'keywords', 'checks']
};

module.exports = ActionFlush;