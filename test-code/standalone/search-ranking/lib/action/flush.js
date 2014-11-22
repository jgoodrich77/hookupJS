'use strict';

var // local libs
util = require('util'),
Q = require('q'),
config = require('../config');

var // models we require
modelKeyword      = require('../model/keyword'),
modelKeywordCheck = require('../model/keyword-check');

function ActionFlush(opts, log) {

  function flushChecksForKeyword(kwId) {

    var
    defer = Q.defer(),
    criteria = {};

    if(!!kwId) {
      if(util.isArray(kwId)) {
        criteria.keyword = {
          '$in': kwId
        };
      }
      else {
        criteria.keyword = kwId;
      }
    }

    modelKeywordCheck
      .find(criteria)
      .remove(function (err, removed)  {
        if(err) {
          return defer.reject(err);
        }
        log.debug('Removed %d keyword check(s)..', removed);
        defer.resolve(removed);
      });

    return defer.promise;
  }

  function flushKeywords(tag, onlyTagged) {

    var
    defer = Q.defer(),
    criteria = {};

    if(!!tag && modelKeyword.validTag(tag)) {
      criteria.tags = modelKeyword.normalizeTag(tag);
    }

    modelKeyword
      .find(criteria, function (err, kws) {
        if(err) {
          return defer.reject(err);
        }

        if(!kws.length) {
          log.warn('No keywords were matched.');
          return defer.resolve(kws);
        }
        else {
          log.debug('matched keywords (%d)', kws.length);
        }

        var
        removedKws = [],
        chain = Q({
          checksRemoved: 0,
          keywordsRemoved: 0,
          keywordsUpdated: 0
        });

        kws.forEach(function (kw) {
          chain = chain
            .then(function (buffer) {

              var
              kwId  = kw._id,
              saver = Q.nfbind(kw.save.bind(kw)),
              remover = Q.nfbind(kw.remove.bind(kw));

              if(!!tag && onlyTagged && !kw.isOnlyTag(tag)) {

                kw.removeTag(tag);

                return saver()
                  .then(function (doc) {
                    buffer.keywordsUpdated++;
                    return buffer;
                  });
              }

              return remover()
                .then(function (removed) {
                  removedKws.push(kwId);
                  buffer.keywordsRemoved++;
                  return buffer;
                });
            });
        });

        return chain
          .then(function (buffer) { // remove all checks for matched keywords

            if(removedKws.length === 0) {
              return buffer;
            }

            return flushChecksForKeyword(removedKws)
              .then(function (removed) {
                buffer.checksRemoved = removed;
                return buffer;
              });
          })
          .then(defer.resolve);
      });

    return defer.promise;
  }
  function flushAllKeywords(buffer) {

    var
    defer = Q.defer();

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
  function flushAllKeywordChecks(buffer) {

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
        .then(flushAllKeywordChecks)
        .then(flushAllKeywords);
    }
    else {

      if(opts.keywords) {
        log.info('Flushing keywords, and associated check data.');

        chain = chain
          .then(function (buffer) {
            return flushKeywords(opts.tag, !!opts.o);
          });
      }
      else if(opts.checks) {
        log.info('Flushing keyword check data only.');

        chain = chain
          .then(function (buffer) {
            var defer = Q.defer();

            if(opts.tag) {
              modelKeyword.findByTag(opts.tag, function (err, kws) {
                if(err) {
                  return defer.reject(err);
                }

                return flushChecksForKeyword(kws.map(function (kw) {
                  return kw._id;
                })).then(defer.resolve);
              });
            }
            else { // clear all checks
              return flushAllKeywordChecks(buffer);
            }

            return defer.promise;
          });
      }
      else {
        log.warn('Neither --keywords or --checks were supplied.. Nothing to do.');
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
  boolean: ['all', 'keywords', 'checks', 'o'],
  string: ['q','t'],
  alias: {
    t: 'tag',
    o: 'only-tag'
  }
};

module.exports = ActionFlush;