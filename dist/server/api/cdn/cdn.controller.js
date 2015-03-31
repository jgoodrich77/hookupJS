'use strict';

var Q = require('q');
var config = require('../../config/environment');
var requestUtils = require('../requestUtils');
var UserUpload = require('../user/upload/upload.model');
var path = require('path');

exports.display = function(req, res, next) {
  Q.nfcall(UserUpload.findById.bind(UserUpload), req.params.id)
    .then(function (doc) {
      if(!doc) {
        return requestUtils.missing(res);
      }

      var
      cacheUntil = (doc.expires||doc.created).getTime();

      res.set({
        'cache-control': 'max-age=' + Math.floor(Math.max(0, (cacheUntil - Date.now()) / 1000))
      });

      res.type(doc.type);
      res.sendfile(path.join(config.root, doc.path), function (err) {
        if (err) {
          console.error(err);
          return requestUtils.missing(res);
        }
      });
    })
    .catch(function (err) {
      console.error(err);
      requestUtils.missing(res);
    });
}