'use strict';

//
// command line keyword management
//

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var
util = require('util'),
Q = require('q'),
mongoose = require('mongoose'),
config = require('./server/config/environment');

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
  {user_id: userId},
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
//  console.log(sites);
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
