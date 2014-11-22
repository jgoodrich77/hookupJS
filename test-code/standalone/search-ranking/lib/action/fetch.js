'use strict';

var // local libs
util = require('util'),
moment = require('moment'),
Q = require('q'),
_ = require('lodash'),
fs = require('fs'),
carrier = require('carrier'),
config = require('../config'),
KeywordQuery = require('../keyword-query');

var // models we require
modelKeyword      = require('../model/keyword'),
modelKeywordCheck = require('../model/keyword-check');

function ActionFetch(opts, log) {

  var
  kwConfig = config.keywordQuery || {},
  importing = !!opts.i;

  if(opts.C) {
    kwConfig.cx = opts.C;
  }
  if(opts.K) {
    kwConfig.auth = opts.K;
  }
  if(opts.n) {
    kwConfig.pages = opts.n;
  }
  if(opts.p) {
    kwConfig.pageSize = opts.p;
  }

  function fetchKeywordRankings (keyword) {
    var
    defer = Q.defer();

    modelKeyword.findOneAndUpdate(
      { query: keyword },
      { query: keyword },
      { upsert: importing },
      function (err, doc) {
        if(err) {
          return defer.reject(err);
        }
        if(!doc) {
          return defer.resolve(false);
        }
        return defer.resolve(doc._id);
      }
    );

    return defer
      .promise
      .then(function (kwDocId) {
        if(!kwDocId) {
          log.warn('skipping (%s), not found in db.', keyword);
          return kwDocId;
        }

        log.debug('fetching keyword data (%s : %j)', keyword, kwDocId);

        return KeywordQuery
          .search(keyword)
          .then(function (kwQuery) {
            log.debug('keyword data (%s) fetched, storing..', keyword);

            try {

              var
              defer2 = Q.defer(),
              checkRow = new modelKeywordCheck({
                keyword: kwDocId,
                results: kwQuery.filter(null, 'rank title snippet link')
              });

            }
            catch(err) {
              return defer2.reject(err);
            }

            checkRow.save(function (err, doc) {
              if(err) {
                return defer2.reject(err);
              }

              log.debug('keyword data (%s) stored..', keyword);
              return defer2.resolve(kwQuery);
            });

            return defer2.promise;
          });
      });
  }

  function findKeywordsByCheckTime(sinceTime) {
    var
    defer = Q.defer(),
    match = {
      lastCheck : {
        '$lte': sinceTime
      }
    },
    sort = {
      'date': 1
    },
    project = {
      _id: 0,
      date: 1,
      keyword: 1
    },
    grouping = {
      _id: {
        keyword: '$keyword'
      },
      lastCheck: {
        '$max': '$date'
      }
    };

    // aggregate pipeline
    modelKeywordCheck.aggregate([
      { '$project': project },
      { '$sort': sort },
      { '$group': grouping },
      { '$match': match }
    ])
    .exec(function (err, docs) {
      if(err) {
        return defer.reject(err);
      }

      return modelKeyword.populate(docs, {
        path: '_id.keyword'
      }, function (err, docs) {
        if(err) {
          return defer.reject(err);
        }

        return defer.resolve(docs);
      });
    });

    return defer.promise;
  }

  function loadFileLines (file) {
    var
    defer = Q.defer(),
    chain = Q({}),

    readStream = fs.createReadStream(file, {
      encoding: 'utf8'
    }),

    lineReader = carrier.carry(readStream, function (line) {
      chain = chain
        .then(function (buffer) {
          return fetchKeywordRankings(line)
            .then(function (kwQuery) {
              buffer[line] = !!kwQuery;
              return buffer;
            })
            .catch(function (err) {
              buffer[line] = false;
              return err;
            });
        });
    });

    readStream.once('end', function () {
      defer.resolve(chain);
    });

    return defer.promise;
  }

  this.run = function() { // run this action

    // configure kw query lib
    KeywordQuery.configure(kwConfig);

    var result;

    if(opts.date) { // kws with no checks since before this date
      var
      inputdate = opts.date,
      date      = moment(),
      matcher   = /(last|next)\s?(\d+)\s?(minutes?|hours?|days?|weeks?|months?|years?)/i;

      if(matcher.test(opts.date)) { // using a smart date
        var
        matched = opts.date.match(matcher),
        mDir    = matched[1].toLowerCase(),
        mAmount = parseInt(matched[2]),
        mStep   = matched[3].toLowerCase();

        if(mDir === 'last') {
          date.subtract(mAmount, mStep);
        }
        else {
          date.add(mAmount, mStep);
        }
      }
      else {
        date = moment(Date.parse(opts.date));
      }

      if(!date.isValid()) {
        throw new Error('Invalid data was provided.');
      }

      log.info('Fetching results for keywords that have not been run since: %s', date.utc().format());

      result = findKeywordsByCheckTime(date.utc().toDate())
        .then(function (kwCheckAggr) {
          var chain = Q({});

          log.info('Found %d keywords', kwCheckAggr.length);

          kwCheckAggr.forEach(function (aggr) {
            chain = chain.then(function (buffer) {
              var kwQuery = aggr._id.keyword.query;

              return fetchKeywordRankings(kwQuery)
                .then(function (kwRankings) {
                  buffer[kwQuery] = kwRankings;
                  return buffer;
                });
            });
          });

          return chain;
        });
    }
    else if(opts.keyword) { // single keyword
      log.info('Fetching results for a single keyword (%s)', opts.keyword);
      result = fetchKeywordRankings(opts.keyword);
    }
    else if(opts.file) {
      log.info('Loading keyword file (%s)..', opts.file);
      result = loadFileLines(opts.file);
    }
    else {
      throw new Error('Invalid keyword spec. No file (-f|--file) or keyword (-k|--keyword) supplied.');
    }

    return result;
  };
}

ActionFetch.minimistOpts = {
  string: ['C','K', 'n','p','k','f','d'],
  boolean: ['i','import'],
  alias: {
    d: 'date',
    i: 'import',
    k: 'keyword',
    f: 'file'
  }
};

module.exports = ActionFetch;