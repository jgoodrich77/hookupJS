'use strict';

//
// command line fetch keywords
//

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

function listKeywordDetails(keywordId) {
  
  var
  defer = Q.defer();

  KeywordCheck.find(
    {keyword_id: keywordId},
    {
      "_id":false,
      "results.url" : true
    }, function(err, docs) {
      if(err) {
        return defer.reject(err);
      }
      defer.resolve(docs);
    });

  return defer.promise;
      
}

function listKeywordDetailsPromise(keywordId) {
  return function(out) {
    return listKeywordDetails(keywordId);
  };
}

// Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options);

Q([])
  .then(function(){
    return listKeyword();
  })
  .then(function(savedKeyword){

    var
    result = Q([]),
    reindexed = {};

    savedKeyword.forEach(function(kw){
      result = result
        .then(listKeywordDetailsPromise(kw._id))
        .then(function(kwdetail) {
          reindexed[kw.keyword] = kwdetail;
          return kwdetail;
        });
    });

    result = result.then(function(){
      return reindexed;
    });

    return result;
  })
  .then(function(sites){
    console.log(sites);
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
