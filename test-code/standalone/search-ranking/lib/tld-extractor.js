'use strict';

var
url = require('url'),
Q = require('q'),
https = require('https');

function TLDExtractor() {
  this.tlds = [];
}

TLDExtractor.prototype.getHostTLD = function (host) {
  if(!this.tlds || !this.tlds.length)
    throw new Error('TLD database has not been loaded yet.');

  var
  bestMatch = false,
  chunks = (host||'').toLowerCase().split('.'),
  tlds = this.tlds,
  tmp;

  // check exceptions
  chunks.every(function (chunk, index) {
    tmp = chunks.slice(index).join('.');

    if(tlds.indexOf('!' + tmp) > -1)
      bestMatch = '.' + chunks.slice(index + 1).join('.');

    return !bestMatch;
  });

  if(!!bestMatch) return bestMatch;

  // normal domain:
  var startest;
  chunks.every(function (chunk, index) {
    tmp = chunks.slice(index).join('.');
    startest = ['*'].concat(chunks.slice(index + 1)).join('.');

    if(tlds.indexOf(tmp) > -1 || tlds.indexOf(startest) > -1)
      bestMatch = '.' + tmp;

    return !bestMatch;
  });

  return bestMatch;
};

TLDExtractor.prototype.getHostDomain = function (host) {
  var
  chunks = (host||'').split('.'),
  tld = this.getHostTLD(host);

  if(!chunks.length || !tld)
    return false;

  var
  tldChunks = tld.split('.'),
  noTld = chunks.slice(0, (chunks.length-tldChunks.length) + 1),
  primaryDom = (noTld.pop() || '');

  return (!!primaryDom ? primaryDom + '.' : '') + tld.substring(1);
};

TLDExtractor.prototype.hasSubDomain = function (host) {
  var
  domain = this.getHostDomain(host);

  if(!domain) return false;

  return host.length > domain.length;
};

TLDExtractor.prototype.loadTlds = function () {
  var
  defer = Q.defer(),

  options = {
    host: 'publicsuffix.org',
    path: '/list/effective_tld_names.dat'
  },

  load = (function (data) {

    var
    lines = data.match(/[^\r\n]+/g).filter(function (line) {
      return !!line && line.trim().substring(0, 2) !== '//';
    });

    if(!lines || !lines.length)
      return;

    this.tlds = lines;

    defer.resolve(this.tlds);
  }).bind(this),

  request = https.request(options, function (res) {
    var
    data = '';

    res.on('data', function (chunk) {
      data += chunk;
    });

    res.on('end', function () {
      load(data);
    });
  });

  request.on('error', function (e) {
    defer.reject(e);
  });

  request.end();

  return defer.promise;
};

module.exports = TLDExtractor;

// var extr = new TLDExtractor();

// extr.loadTlds()
//   .then(function (tlds) {
//     console.log('Loaded %d domain tlds.', tlds.length);

//     var testDomains = [
//       "www.niki.miki.bg"  ,
//       "www.niki.1.bg"   ,
//       "www.niki.jp" ,
//       "www.niki.co.jp"  ,
//       "www.niki.co.kr"  ,
//       "www.niki.com.pr" ,
//       "www.niki.us"   ,
//       "www.niki.ny.us"  ,
//       "www.президент.рф"  ,
//       "www.niki.co.uk"  ,
//       "www.parliament.uk" ,
//       "musedoma.museum" ,
//       "niki.museum"   ,
//       "www.niki.national.museum"  ,
//       "www.niki.AT"   ,
//       "www.niki.CO.AT"  ,
//       "www.niki.uk"   ,
//       "www.niki.pr"   ,
//       "my-site.io"   ,
//       "www.my-site.io"   ,
//       "my-site.co.cr"   ,
//       "www.my-site.co.cr"   ,
//       "my-site.co.uk"   ,
//       "www.my-site.co.uk"   ,
//       "my-site.com"   ,
//       "www.my-site.com"   ,
//       "www1.www2.www3.my-site.com"   ,
//       "www.nonexistent.hello" ,
//       ""      ,
//       "com"     ,
//       "uk"
//     ];

//     testDomains.forEach(function (dom) {

//       console.log('(%s) extracted: %s', dom, extr.getHostDomain(dom));
//     });
//   });