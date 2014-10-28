'use strict';

// experiments from 10/27
// adding ability to parse, dump and examine the object from
// the custom search API
// because looks wrong in rockmongo

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var
util = require('util'),
Q = require('q'),
mongoose = require('mongoose'),
GoogleApis = require('googleapis'),
GoogleCustomSearch = GoogleApis.customsearch('v1'),
config = require('./server/config/environment');

var // global consts
CX = '011021103555954735202:pwnxq-g5oqm',
API_KEY = 'AIzaSyCUYEYegGBggut_PCV8ePAyRWvEGLPPEaU';

// model classes
require('./server/api/keyword/keyword.model.js');
require('./server/api/keyword/checks/checks.model.js');

var
Keyword      = mongoose.model('Keyword'),
KeywordCheck = mongoose.model('KeywordCheck');

function saveKeyword(keyword) {
  var
  defer = Q.defer();

  Keyword.find();

  return defer.promise;
}

function checkKeyword(keyword, pages, pageSize) {
  pages = pages || 10;
  pageSize = pageSize || 10;

  var
  fetchData = function(startIndex) {
    return function(){
      var defer = Q.defer();

      GoogleCustomSearch.cse.list({
          cx: CX,
          auth: API_KEY,
          q: keyword,
          start: startIndex,
          num: pageSize
        },
        function (error, response) {
          if(error) { // break the promise
            return defer.reject(error);
          }

          if(!!response && !!response.items) {
            allResults = allResults.concat(response.items);
            defer.resolve(response.items);
          }
          else {
            defer.reject(new Error('No items found in result'));
          }
        }
      );

      return defer.promise;
    };
  },
  allResults,
  result = Q([])
    .then(function(output){ // seed allResults buffer
        return allResults = output;
    });

  for(var i = 1; i <= (pages * pageSize); i = i + pageSize) {
    result = result.then(fetchData(i));
  }

  result = result.then(function(lItems){
    return allResults;
  });

  return result;
}

function saveKeywordCheck(keywordId, resultRows) {
  var
  defer = Q.defer(),
  tmp = new KeywordCheck({
    keyword_id: keywordId
  });

  resultRows.forEach(function(result){

var urlParse = require('url').parse;
var parsed = urlParse(result.link);
var webdomain = parsed.hostname;

console.log( 'title is ' + result.title );
console.log( 'link is ' + result.link );
console.log( 'domain is ' + webdomain );

tmp.results.push({
    website: webdomain,
    url: result.link,
    title: result.title,
    snippet: result.snippet,
    metatags: result.metatags
    });

  });

  tmp.save(function(err, doc){
    if(err||!doc) {
    return defer.reject(err);
  }
    defer.resolve(doc);
  });

  return defer.promise;
}

var
testKeyword = 'Data',
testPages = 3,
testPageSize = 10,
storedKw;

// Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options);

Q([])
  .then(function(){
    return saveKeyword(testKeyword);
  })
  .then(function(savedKeyword){
    console.log(savedKeyword);

    storedKw = savedKeyword;

    return checkKeyword(storedKw.keyword, testPages, testPageSize);
  })
  .then(function(checkResult){
    return saveKeywordCheck(storedKw._id, checkResult);
  })
  .catch(function(err){
    if(util.isError(err)) {
      console.error(err.stack);
    }
    else {
      console.error('An error occurred:', err);
    }
    return err;
  })
  .finally(function(){
    mongoose.disconnect();
  });
