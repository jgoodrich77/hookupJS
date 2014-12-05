'use strict';

var
_ = require('lodash'),
Q = require('q'),
util = require('util'),
path = require('path'),
url = require('url'),
crypto = require('crypto'),
request = require('request');

function FacebookGraph(config) {
  var
  optData = {
    apiUrl: 'https://graph.facebook.com/v2.2',
    appKey: null,
    appSecret: null,
    accessToken: null,
    timeout: 10000,
    proxy: null
  },
  opt = function (key, defaultVal) {
    if(optData[key] === undefined || optData[key] === null) {
      return defaultVal;
    }
    return optData[key];
  },
  optSet = function(key, value) {
    optData[key] = value;
  };

  var
  apiUrlParsed,
  keyAccessToken = 'access_token',
  keySecretProof = 'appsecret_proof';

  _.extend(this, {
    reloadUrl: function() {
      apiUrlParsed = url.parse(opt('apiUrl'), true, true);
      return this;
    },
    configure: function (cfg) {
      Object.keys(cfg||{}).forEach(function (key) {
        optSet(key, cfg[key]);
      });

      // reload elements after configuring them
      this.reloadUrl();
    },
    createAppSecretProof: function(accessToken, appSecret) {
      var
      hmac = crypto.createHmac('sha256', appSecret);
      hmac.update(accessToken);
      return hmac.digest('hex');
    },
    createUrl: function(ipath, uriParams) {
      var
      tempUrl = _.merge({}, apiUrlParsed);

      // delete aliases
      delete tempUrl.path;
      delete tempUrl.href;
      delete tempUrl.hostname;

      // modify the path / querystring as needed
      tempUrl.pathname = path.join(tempUrl.pathname||'/', ipath);
      tempUrl.query = _.merge(tempUrl.query||{}, uriParams);

      var
      cfgAccessToken = opt('accessToken', false),
      cfgAppSecret   = opt('appSecret', false),
      tmpToken       = cfgAccessToken || false;

      if(!!uriParams[keyAccessToken] && (uriParams[keyAccessToken] !== tmpToken)) { // override with supplied access token, if available.
        tmpToken = uriParams[keyAccessToken];
      }

      if(tmpToken) { // set our access token, and secret proof for token
        tempUrl.query[keyAccessToken] = tmpToken;

        if(cfgAppSecret) {
          tempUrl.query[keySecretProof] = this.createAppSecretProof(tmpToken, cfgAppSecret);
        }
      }

      return url.format(tempUrl);
    },
    encodePostData: function(data) {
      return Object.keys(data)
        .reduce(function (p, c) {
          var value = data[c];

          if(typeof value !== 'string') {
            value = JSON.stringify(value);
          }

          return p + encodeURIComponent(c) + '=' + encodeURIComponent(value) + '&';
        }, '')
        .replace(/\&$/, '');
    },
    request: function(path, uriParams, method, data) {

      var
      defer = Q.defer(),
      requestOpts = {
        method: method || 'GET',
        uri: this.createUrl(path, uriParams),
        timeout: opt('timeout'),
        proxy: opt('proxy')
      };

      if(requestOpts.method.toUpperCase() === 'POST') {
        requestOpts.body = (typeof data === 'string')
          ? data
          : this.encodePostData(data);
      }

      request(requestOpts, function (error, response, body) {
        if(!!error) {
          return defer.reject(error);
        }
        else if(response.statusCode !== 200) {
          var errorMessage;

          if(body) {
            var decoded = JSON.parse(body);
            if(!!decoded && decoded.error) {
              errorMessage = decoded.error.message || decoded.error;
            }
          }

          return defer.reject(new Error(util.format('Unexpected return code (%d) was received.%s', response.statusCode, !!errorMessage ? ' Facebook said: ' + errorMessage : '')));
        }

        return defer.resolve(JSON.parse(body));
      });

      return defer.promise;
    },
    get: function(path, uriParams) {
      return this.request(path, uriParams, 'GET');
    },
    getRecursive: function(path, uriParams, limit, rows) {
      rows = rows || [];
      var me = this;
      return this.get(path, uriParams)
        .then(function (data) { // data is our initial recordset from FB
          var
          rowSet = data.data,
          paging = data.paging;

          if(!!rowSet && rowSet.length) {
            rows = rows.concat(rowSet);
          }

          if(!!paging && !!paging.next && (!limit || rows.length < limit)) {
            var
            nUrl = paging.next.replace(opt('apiUrl'), ''), // trim out parent api url
            nParsed = url.parse(nUrl, true, true);
            return me.getRecursive(nParsed.pathname, nParsed.query, limit, rows);
          }

          if(!!limit && rows.length > limit) { // truncate the array
            rows.splice(limit - 1, rows.length - limit);
          }

          return rows;
        });
    },
    post: function(path, uriParams, data) {
      return this.request(path, uriParams, 'POST', data);
    },
    del: function(path, uriParams) {
      return this.request(path, uriParams, 'DELETE');
    }
  });

  this.configure(config);
}

module.exports = FacebookGraph;