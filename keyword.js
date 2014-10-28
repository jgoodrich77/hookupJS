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

function listKeywordDetails(keywordId) {
  
  var
  defer = Q.defer();

  KeywordCheck.find(
        {keyword_id: keywordId},
{url : 1},
  function (err, doc) {
      if(err || !doc) {
      return defer.reject(err);
    }

    defer.resolve(doc);
  });
//console.log(defer);
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

//return listKeyword();
return listKeywordDetails(storedKw._id);


}
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
