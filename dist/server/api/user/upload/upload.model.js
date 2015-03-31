'use strict';

var mongoose = require('mongoose'),
    rmdir = require('rimraf'),
    path = require('path'),
    Schema = mongoose.Schema,
    config = require('../../../config/environment/index');

var
cfgUploads = config.uploads;

var
UserUploadSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  path: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  expires: {
    type: Date
  },
  created: {
    type: Date,
    default: Date.now
  }
});

// Public profile information
UserUploadSchema
  .virtual('url')
  .get(function() {
    return path.join(config.uploads.route, String(this._id));
  });

UserUploadSchema
  .virtual('urlFqdn')
  .get(function() {
    return config.publicUrl + '/'+ path.join(config.uploads.routeCdn, String(this._id));
  });

UserUploadSchema
  .virtual('info')
  .get(function() {

    return {
      '_id': this._id,
      'type': this.type,
      'url': this.url
    };
  });


UserUploadSchema.statics = {
  nukeUserUploads: function (userId, cb) {
    this.find({ user: userId }).remove(function (err, remResult) {
      if(err) return cb(err);

      rmdir(path.join(cfgUploads.saveDir, String(userId)), function (err) {
        if(err) return cb(err);
        cb(null, true);
      });
    });
  }
};

module.exports = mongoose.model('UserUpload', UserUploadSchema);