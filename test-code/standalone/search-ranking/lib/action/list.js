'use strict';

var // local libs
util = require('util'),
Q = require('q'),
config = require('../config');

var // models we require
modelKeyword      = require('../model/keyword'),
modelKeywordCheck = require('../model/keyword-check');

function ActionList(opts, log) {
  log.debug('Options:', opts);

  var
  showResults = !!opts.results,
  showResultTitle = !!opts.title,
  showResultSnippet = !!opts.snippet,
  csvFormat = !!opts.csv;

  function findKeywords(criteria) {
    criteria = criteria || {};

    var defer = Q.defer();

    modelKeyword.find(criteria, '_id query', function (err, docs) {
      if(err) {
        return defer.reject(err);
      }
      return defer.resolve(docs);
    });

    return defer.promise;
  }

  function findKeywordChecks(keywordIds) {
    var
    defer = Q.defer(),
    match = {
      keyword : {
        '$in': keywordIds
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
      _id: '$keyword',
      lastCheck: {
        '$max': '$date'
      },
      firstCheck: {
        '$min': '$date'
      },
      totalChecks: {
        '$sum': 1
      }
    };

    if(showResults || csvFormat) {
      project.results = 1;
      grouping.latestResults = {
        '$last': '$results'
      };
    }

    // aggregate pipeline
    modelKeywordCheck.aggregate([
      { '$match': match },
      { '$project': project },
      { '$sort': sort },
      { '$group': grouping }
    ])
    .exec(function (err, docs) {
      if(err) {
        return defer.reject(err);
      }

      return defer.resolve(docs);
    });

    return defer.promise;
  }

  this.run = function () {

    var
    kwPromise;

    if(opts.all) {
      kwPromise = findKeywords();
    }
    else if(opts.query) {
      kwPromise = findKeywords({
        query: new RegExp(opts.query, 'i')
      });
    }
    else if(opts.tag) {
      var findByTag = Q.nfbind(modelKeyword.findByTag.bind(modelKeyword));
      kwPromise = findByTag(opts.tag);
    }
    else {
      throw new Error('Invalid keyword list spec. All (-a|--all) or search (-q|--query) or tag (-t|--tag) was not supplied.');
    }

    return kwPromise
      .then(function (keywords) {
        log.debug('Got back keywords:', keywords);

        var kwIdQueryMap = {};

        return findKeywordChecks(keywords.map(function (keyword) {
          kwIdQueryMap[keyword._id] = keyword.query;
          return keyword._id;
        })).then(function (kwChecks) {
          return kwChecks.map(function (kwCheck) {
            kwCheck.keyword = kwIdQueryMap[kwCheck._id];
            return kwCheck
          });
        });
      })
      .then(function (keywordWithChecks) {
        keywordWithChecks.forEach(function (kwCheck) {

          if(showResults) {
            process.stdout.write('\n');
          }

          if(!csvFormat) {
            process.stdout.write(util.format('keyword: %j, totalChecks: %d, lastCheck: %s, firstCheck: %s\n',
              kwCheck.keyword,
              kwCheck.totalChecks,
              kwCheck.lastCheck,
              kwCheck.firstCheck
            ));
          }

          if(showResults || csvFormat) {
            kwCheck.latestResults.forEach(function (result) {

              if(csvFormat) {
                var
                fmt = ['%j','%j','%d','%j'],
                args = [kwCheck.keyword, kwCheck.lastCheck, result.rank, result.link];

                if(showResultTitle) {
                  fmt.push('%j');
                  args.push(result.title);
                }

                if(showResultSnippet) {
                  fmt.push('%j');
                  args.push(result.snippet);
                }

                // prepend format to args
                args.unshift(fmt.join(','));

                // write out CSV string to the stdout
                return process.stdout
                  .write(util.format.apply(util, args) + '\n');
              }

              var
              resultLine = util.format(' %d) link: %j\n',
                result.rank,
                result.link
              );

              if(showResultTitle) {
                resultLine += util.format('-- title: %j\n', result.title);
              }
              if(showResultSnippet) {
                resultLine += util.format('-- snippet: %j\n', result.snippet);
              }

              return process.stdout.write(resultLine);
            });
          }
        });

        return keywordWithChecks;
      });
  };
}

ActionList.minimistOpts = {
  boolean: ['a','r','T','s','c'],
  string: ['q','t'],
  alias: {
    c: 'csv',
    T: 'title',
    s: 'snippet',
    r: 'results',
    t: 'tag',
    a: 'all',
    q: 'query'
  }
};

module.exports = ActionList;