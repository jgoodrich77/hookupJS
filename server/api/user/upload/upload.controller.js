'use strict';

var
path = require('path'),
crypto = require('crypto'),
format = require('util').format,
objectId = require('mongoose').Types.ObjectId,
Q = require('q'),
fs = require('fs'),
mkdirp = require('mkdirp'),
config = require('../../../config/environment/index'),
User = require('../user.model'),
UserUpload = require('./upload.model'),
requestUtils = require('../../requestUtils');

var
cfgUploads = config.uploads;

function qcRespondError(res) {
  return function (err) {
    console.log(err);
    res.send(500, err.message || err);
    return err;
  };
}

exports.index = function(req, res, next) {
  Q.nfcall(UserUpload.find.bind(UserUpload), {
      user: req.user._id
    })
    .then(function (rows) {
      res.json(200, rows.map(function (row) {
        return row.info;
      }));
    })
    .catch(qcRespondError(res));
};

exports.create  = function(req, res, next) {

  if(!req.files || !req.files.file) {
    return requestUtils.missing(res);
  }

  var
  uploadPath = path.join(cfgUploads.saveDir, String(req.user._id)), // user dir namespace
  inFile = req.files.file;

  // TODO: check file mimeType

  Q.nfcall(mkdirp, uploadPath)
    .then(function () { // save file
      var
      defer = Q.defer(),
      result = new UserUpload({ // manually configure this
        _id: objectId(),
        user: req.user._id
      }),
      finalDestination = path.join(uploadPath, String(result._id));

      inFile.file.pipe(fs.createWriteStream(finalDestination)); // save file to path
      inFile.file.on('end', function (data) {

        result.path = path.relative(config.root, finalDestination);
        result.type = inFile.mimeType;
        result.expires = new Date(Date.now() + (8.64e7 * 14)); // 14 day expiration

        defer.resolve(result);
      });

      return defer.promise;
    })
    .then(function (fileUpload) {
      return Q.nfcall(fileUpload.save.bind(fileUpload))
        .then(function () {
          return fileUpload;
        });
    })
    .then(function (doc) {
      requestUtils.data(res, doc.info);
    })
    .catch(next);
};

exports.show  = function(req, res, next) { // pass thru content
  Q.nfcall(UserUpload.findOne.bind(UserUpload), {
      user: req.user._id,
      _id: req.params.id
    })
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
    .catch(qcRespondError(res));
};

exports.destroy  = function(req, res, next) {
  Q.nfcall(UserUpload.findOne.bind(UserUpload), {
      user: req.user._id,
      _id: req.params.id
    })
    .then(function (doc) {
      if(!doc) {
        return requestUtils.missing(res);
      }

      return Q.nfcall(fs.unlink.bind(fs), doc.path)
        .then(function () {
          return Q.nfcall(doc.remove.bind(doc));
        });
    })
    .then(function () {
      return requestUtils.ok(res);
    })
    .catch(qcRespondError(res));
};