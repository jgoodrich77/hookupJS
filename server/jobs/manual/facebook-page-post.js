'use strict';

var
qLoadUserObjectInfo = require('../common/load-user-info');

module.exports = function(job, done) {

  var
  jobData  = job.attrs.data = (job.attrs.data || {}),
  userId   = jobData.userId,
  objectId = jobData.facebookObjectId;

  return qLoadUserObjectInfo(userId, objectId)
    .then(function (objectInfo) {

      console.log(objectInfo);
      done();

      return objectInfo;
    })
    .catch(done);
};