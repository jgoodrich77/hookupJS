'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var util = require('util');
var Q = require('q');

var GoogleApis = require('googleapis');
var GoogleCustomSearch = GoogleApis.customsearch('v1');

var mongoose = require('mongoose');
var config   = require('./server/config/environment');

var CX = '011021103555954735202:pwnxq-g5oqm';
var API_KEY = 'AIzaSyCUYEYegGBggut_PCV8ePAyRWvEGLPPEaU';

// Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options);

// require models needed
require('./server/api/keyword/keyword.model.js');

var Keyword = mongoose.model('Keyword');

function fetchKeyword(keyword, pages, pageSize) {
  pages = pages || 10;
  pageSize = pageSize || 10;

  var
  allResults,
  fetchData = function(startIndex) {
    return function(){
        var defer = Q.defer();

        GoogleCustomSearch.cse.list({
            cx: CX,
            auth: API_KEY,
            q: keyword,
            start: startIndex,
            num: pageSize
        }, function(error, response) {
            if(error) { // break the promise
              defer.reject(error);
            }

            if(!!response && !!response.items) {
                allResults = allResults.concat(response.items);
		defer.resolve(response.items);
            }
        });

      return defer.promise;
    };
  },
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

var
searchFor = 'digital cameras',
pages = 2; // pages of 10 results

Q(null)
  .then(function(){
  
    // TODO: SAVE KW AND GET KW ID
    // read up on $upsert :)
 
 // return Keyword.update(); // promise!!
  })
  .then(function(results){ // results = return Keyword.update  (this might be a full keyword document)


fetchKeyword(searchFor, pages)
    console.log('final results:', results);
  // TODO: SAVE KW AND GET KW ID

    var tmp = new KeywordCheck({
   keyword_id: // what's the the ??? for?
 });

    results.forEach(function(result){
	tmp.results.push({
		domain: result.url,
		url: result.url,
		title: result.title,
		snippet: result.snippet,
		metatags: result.metatags
   });
 });

    return tmp.save();
   })

   })
  .catch(function(err){
    if(util.isError(err)) {
      console.error(err.stack);
    }
    else {
      console.error('An error occurred:', err);
    }
  })
  .finally(function(){
    mongoose.disconnect();
  });
