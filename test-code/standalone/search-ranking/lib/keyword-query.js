'use strict';

var
util = require('util'),
url = require('url'),
Q = require('q'),
_ = require('lodash'),
GoogleApis = require('googleapis'),
GoogleCustomSearch = GoogleApis.customsearch('v1');

var
FilterMatch = require('./filter-match');

function KeywordQuery (cfg) {
  cfg = cfg || {};

  var
  results,
  googleCX  = cfg.cx,
  googleKEY = cfg.auth,
  pages     = parseInt(cfg.pages    || 10),
  pageSize  = parseInt(cfg.pageSize || 10);

  _.extend(this, {
    getResults: function () {
      return results;
    },
    clearResults: function () {
      results = [];
      return this;
    },
    addResults: function (list) {

      if(!util.isArray(list) || !list.length) { // skip
        return this;
      }

      list.forEach(function (result) {
        if(!result || typeof result !== 'object') {
          return;
        }

        // write the rank index for this result relative to our collection.
        result.rank = results.length + 1;

        if(result.link) { // parse the url and store along with the result (filter/match convienence)
          result.linkParsed = url.parse(result.link, true, true);
        }

        // if(result.pagemap) {
        //   result.pagemap = JSON.stringify(result.pagemap);
        // }

        results.push(result);
      });

      return this;
    },
    filter: function (match, cols) {
      var
      resultList = this.getResults(),
      matcher = new FilterMatch(match);

      if(!resultList.length) { // no results
        return [];
      }

      if(!!cols && !util.isArray(cols)) {
        if(typeof cols === 'string')  {
          cols = cols.split(' ');
        }
      }

      return resultList
        .filter(matcher.test.bind(matcher))
        .map(function (result) {
          var fresult = {};

          if(cols) { // seed specific columns
            cols.forEach(function (col) {
              if(typeof col !== 'string') { // skip
                return;
              }

              fresult[col] = result[col];
            });
          }
          else { // pass entire row
            fresult = result;
          }

          return fresult;
        });
    },
    search: function (keyword) {

      // temporary, do not commit the line below!
      // return Q(this.addResults(require('./static.json')));

      var
      result = Q(this),
      fetchData = function (startIndex) {
        return function (kwQuery) {
          var defer = Q.defer();

          GoogleCustomSearch.cse.list({
            q:     keyword,
            cx:    googleCX,
            auth:  googleKEY,
            start: startIndex,
            num:   pageSize
          }, function (error, response) {
            if(error) { // break the promise
              return defer.reject(error);
            }

            if(!!response && !!response.items) {
              return defer.resolve(kwQuery.addResults(response.items));
            }
            else {
              return defer.resolve(kwQuery);
            }
          });

          return defer.promise;
        };
      };

      for(var i = 1; i <= (pages * pageSize); i = i + pageSize) {
        result = result.then(fetchData(i));
      }

      return result;
    }
  });

  this.clearResults();
}

_.extend(KeywordQuery, {
  defaultCseCfg: {
    cx: null,
    auth: null,
    pages: 10,
    pageSize: 10
  },
  configure: function (cfg) {
    _.merge(KeywordQuery.defaultCseCfg, cfg);
  },
  search: function (keyword) {
    return (new KeywordQuery(KeywordQuery.defaultCseCfg)).search(keyword);
  }
});

module.exports = KeywordQuery;