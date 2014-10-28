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

function listKeyword() {
  var
  defer = Q.defer();

  Keyword.find(
  function (err, doc) {
      if(err || !doc) {
      return defer.reject(err);
    }

    defer.resolve(doc);
  });

  return defer.promise;
}

function fromKeywordChecks(keywordId) {
  var
  defer = Q.defer();

  KeywordCheck.find(
          { _id: keywordId },
  function (err, doc) {
      if(err || !doc) {
      return defer.reject(err);
    }

    defer.resolve(doc);
  });

  return defer.promise;
      
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

var storedKw;
// Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options);

Q([])
  .then(function(){
    return listKeyword();
  })
  .then(function(savedKeyword){
    console.log(savedKeyword);
for (var i = 0; i < savedKeyword.length; i++) { 
    storedKw = savedKeyword[i];


 return fromKeywordChecks(storedKw.id);
}
  })
  .then(function(sites){
    console.log(sites);
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
