'use strict';

var
Q = require('q'),
facebook = require('../../components/facebook'),
UserUpload = require('../../api/user/upload/upload.model'),
qLoadUserObjectInfo = require('../common/load-user-info');

module.exports = function(job, done) {

  var
  jobData  = job.attrs.data = (job.attrs.data || {}),
  promise  = Q(jobData),
  userId   = jobData.userId,
  dmedia;

  if(jobData.media) {
    promise = promise.then(function (buffer) {
      return Q.nfcall(UserUpload.findOne.bind(UserUpload), {
        user: buffer.userId,
        _id: buffer.media
      }).then(function (fileUpload) {
        dmedia = fileUpload;
        return buffer;
      })
    });
  }

  return  promise.then(function (buffer) {
    var objectId = buffer.facebookObjectId;
     return qLoadUserObjectInfo(buffer.userId, objectId)
      .then(function (objectInfo) {
        if(dmedia) {
          return facebook.publishPhoto(objectId, objectInfo.pageToken, dmedia.urlFqdn, buffer.text, false)
            .then(function (result) {
              buffer.result = result;
              return result;
            });
        }

        return facebook.postMessage(objectId, objectInfo.pageToken,
            buffer.text,
            buffer.link,
            buffer.caption,
            buffer.name,
            buffer.description
          ).then(function (result) {
            buffer.result = result;
            return result;
          });
      });
  })
  .then(function (result) {
    done();
    return result;
  })
  .catch(done);
};