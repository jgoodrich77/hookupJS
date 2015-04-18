'use strict';

var // local libs
util = require('util'),
url = require('url'),
carrier = require('carrier'),
fs = require('fs'),
Q = require('q'),
config = require('../config'),
TLDExtractor = require('../tld-extractor');

var // models we require
modelKeyword      = require('../model/keyword'),
modelKeywordCheck = require('../model/keyword-check');

function ActionDashboard(opts, log) {
  log.debug('Options:', opts);

  var
  kwConfig = config.dashboard || {},
  domains = opts.domains,
  tag     = opts.tag,
  keyword = opts.keyword,
  file    = opts.file,
  tldExtractor = new TLDExtractor;

  if(!domains) throw new Error('`domains` not provided, and is required.');

  if(!keyword && !tag && !file)
    throw new Error('No keyword spec (keyword, file or tag) was provided.');

  domains = domains.split(/,\s*/);

  log.debug('domains:', domains);
  log.debug('tag:', tag);
  log.debug('keyword:', keyword);
  log.debug('file:', file);

  function findKeywordsByTag(tag) {
    var
    defer = Q.defer();

    modelKeyword.findByTag(tag, function (err, docs) {
      if(err) {
        return defer.reject(err);
      }
      return defer.resolve(docs);
    });

    return defer.promise;
  }

  function loadFileKeywords(file) {
    var
    defer = Q.defer(),
    keywords = [],
    readStream = fs.createReadStream(file, {
      encoding: 'utf8'
    }),

    lineReader = carrier.carry(readStream, function (line) {
      keywords.push(line);
    });

    readStream.once('end', function () {
      defer.resolve(keywords);
    });

    return defer.promise;
  }

  function sameDomain(a, b, strict) {
    a = (a || '').toLowerCase();
    b = (b || '').toLowerCase();

    var
    aExtract = tldExtractor.getHostDomain(a),
    bExtract = tldExtractor.getHostDomain(b);

    if(!aExtract || !bExtract)
      return false;

    if((aExtract === bExtract) && !!strict) {
      return a === b;
    }

    return aExtract === bExtract;
  }

  function findDomainsPositions (urls) {
    var
    output = {},
    found  = 0;

    if(!urls || !urls.length || !domains || !domains.length)
      return output;

    urls.every(function (curl, urlIndex) {
      var
      parsed = url.parse(curl.link),
      compareHost = parsed.host;

      domains.forEach(function (domain, domainIndex) {
        if(output[domain] !== undefined) return; // continue;

        if(sameDomain(compareHost, domain, tldExtractor.hasSubDomain(domain))) {
          output[domain] = curl.rank;
          found++;
        }
      });

      return found < domains.length;
    });

    return output;
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
      keyword: 1,
      results: 1
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
      },
      latestResults: {
        '$last': '$results'
      }
    };

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

  function padLeft (nr, n, str) {
    return Array(n-String(nr).length+1).join(str||' ')+nr;
  }

  this.run = function () {

    var
    keywordIdMap = {};

    return tldExtractor.loadTlds()
      .then(function() { // determine keywords we're going to use.
        if(file) { // multiple kws
          return loadFileKeywords(file);
        }
        else if(tag) { // multiple kws
          return findKeywordsByTag(tag)
            .then(function (kwDocs) {
              return kwDocs.map(function (kw) {
                return kw.query;
              });
            });
        }
        else if(keyword) { // single kw
          return [keyword];
        }

        return false;
      })
      .then(function (kws) { // find keyword matches in the database:
        if(!kws || !kws.length)
          return false;

        var
        defer = Q.defer();

        modelKeyword
          .find({ query: { $in: kws } })
          .sort({ query: 1 })
          .exec(function (err, results) {
            if(err) {
              return defer.reject(err);
            }

            return defer.resolve(results);
          });

        return defer.promise;
      })
      .then(function (kws) { // find last checks for these kws:
        if(!kws || !kws.length)
          return false;

        log.debug('Loading checks for (%s)', kws.map(function (kw) { return kw.query }).join(', ') );

        return findKeywordChecks(kws.map(function (kw) {
          keywordIdMap[kw._id] = kw.query;
          return kw._id;
        }) );
      })
      .then(function (kwChecks) { // find last checks for these kws:
        if(!kwChecks) return false;

        log.debug('Checks loaded, mapping competitor domains.');

        var
        results = [];

        kwChecks.forEach(function (check) {
          var keyword = keywordIdMap[check._id];

          log.debug('mapping (%s)', keyword);

          results.push({
            kw:          keyword,
            competitors: findDomainsPositions(check.latestResults),
            resultFrom:  check.lastCheck
          });
        });

        // assemble CSV table:

        console.log(['Keyword', domains.join(','), '"result date/time"'].join(','))

        results.forEach(function (result) {
          console.log('%j,%s,%j', result.kw, domains.reduce(function (p, c) {
            var
            domainLen = c.length,
            competRes = result.competitors[c] || '---';
            p.push(JSON.stringify(competRes));
            return p;
          }, []).join(','), result.resultFrom);
        });

        return false;
      });
  };
}

ActionDashboard.minimistOpts = {
  boolean: [],
  string: ['d', 't', 'k', 'f'],
  alias: {
    k: 'keyword',
    f: 'file',
    d: 'domains',
    t: 'tag'
  }
};

module.exports = ActionDashboard;