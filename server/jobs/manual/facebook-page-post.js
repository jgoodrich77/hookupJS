'use strict';

var
facebook = require('../../components/facebook'),
qLoadUserObjectInfo = require('../common/load-user-info');

module.exports = function(job, done) {

  var
  jobData  = job.attrs.data = (job.attrs.data || {}),
  userId   = jobData.userId,
  objectId = jobData.facebookObjectId;

  return qLoadUserObjectInfo(userId, objectId)
    .then(function (objectInfo) {
      return facebook.post(objectId, objectInfo.pageToken, jobData.text)
        .then(function (result) {
          jobData.result = result;
          return result;
        });
    })
    .then(function (result) {
      done();
      return result;
    })
    .catch(done);
};