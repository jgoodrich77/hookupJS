'use strict';

var
mongoose = require('mongoose'),
Schema   = mongoose.Schema;

var
UserJobSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobId: {
    type: Schema.Types.ObjectId,
    required: true
  }
});

var
forceObjectId = mongoose.Types.ObjectId.bind(mongoose.Types);

var
calculateDuration = function(d1, d2) {
  var
  d1MS = (d1 instanceof Date) ? d1.getTime() : Date.parse(d1),
  d2MS = (d2 instanceof Date) ? d2.getTime() : Date.parse(d2);
  return Math.abs(d1MS - d2MS);
};

UserJobSchema.statics = {
  jobSorter: function(ascending) {
    return function (a, b) { // newest -> oldest
      var
      aLastActionMS = !!a.finished ? a.finished.getTime() : (!!a.started ? a.started.getTime() : 0),
      bLastActionMS = !!b.finished ? b.finished.getTime() : (!!b.started ? b.started.getTime() : 0);
      return !!ascending ?
        (aLastActionMS - bLastActionMS) :
        (bLastActionMS - aLastActionMS);
    };
  },
  normalizeJob: function(j) {
    var
    record = {
      id: j.attrs._id
    },
    attrs = j.attrs,
    duration, result, status;

    if(attrs.lastRunAt && attrs.lastFinishedAt) {
      record.status   = 'finished';
      record.result   = attrs.data.result;
      record.duration = calculateDuration(attrs.lastRunAt, attrs.lastFinishedAt);
      record.started  = new Date(attrs.lastRunAt);
      record.finished = new Date(attrs.lastFinishedAt);
    }
    else if(attrs.lastRunAt && !attrs.lastFinishedAt) {
      record.status   = 'running';
      record.started  = new Date(attrs.lastRunAt);
    }
    else {
      record.status   = 'pending';
    }

    return record;
  },

  nukeUserJobs: function(agenda, userId, cb) {
    var me = this;

    this.findAllUserJobIds(userId, function (err, jobs) {
      if(err) return cb(err);
      if(!jobs || !jobs.length) return cb(null, true);

      // cancel matching agenda jobs
      agenda.cancel({
        _id: { '$in': jobs }
      }, function (err, agendaResult) {
        if(err) return cb(err);

        // delete matching user jobs
        me.find({ userId: userId})
          .remove(function (err, modelResult) {
            if(err) return cb(err);

            cb(null, true);
          });
      });
    });
  },

  findAllUserJobIds: function(userId, cb) {
    this.find({ userId: userId }, 'jobId', function (err, jobs) {
      if(err) return cb(err);
      if(!jobs || !jobs.length) return cb(null, jobs);

      cb(null, jobs.map(function (j) {
        return forceObjectId(j.jobId);
      }));
    });
  },
  findUserJobs: function(agenda, userId, query, cb) {
    query = query || {};

    this.findAllUserJobIds(userId, function (err, jobIds) {
      if(err) return cb(err);
      if(!jobIds || !jobIds.length) return cb(null, jobIds);

      if(!query._id) {
        query._id = {
          '$in': jobIds
        };
      }

      agenda.jobs(query, cb);
    });
  },
  findDetailedByUser: function(agenda, userId, cb) {
    this.findAllUserJobIds(userId, function (err, jobIds) {
      if(err) return cb(err);
      if(!jobIds || !jobIds.length) return cb(null, jobIds);

      agenda.jobs({ _id: {
        '$in': jobIds
      }}, cb);
    });
  },
  findDetailedById: function(agenda, jobId, cb) {
    agenda.jobs({ _id: forceObjectId(jobId) }, function (err, docs) {
      if(err) return cb(err);
      if(docs.length === 0) return cb(null);
      return cb(docs[0]);
    });
  },
  cancelUserJob: function(agenda, userId, jobId, cb) {
    this.findOne({ userId: userId, jobId: jobId }, function (err, doc) {
      if(err) return cb(err);
      if(!doc) return cb(null);

      doc.remove(function (err) {
        if(err) return cb(err);
        agenda.cancel({ _id: forceObjectId(jobId) }, cb);
      });
    });
  },
  cancelJob: function(agenda, jobId, cb) {
    this.findOne({ jobId: jobId }, function (err, doc) {
      if(err) return cb(err);
      if(!doc) return cb(null);

      doc.remove(function (err) {
        if(err) return cb(err);
        agenda.cancel({ _id: forceObjectId(jobId) }, cb);
      });
    });
  },
  createJob: function(agenda, userId, type, data, schedule, cb) { // creates an unscheduled job!
    var
    job = agenda.create(type, data),
    now = new Date,
    me = this;

    if(!job) {
      return cb(new Error('Could not create requested job'));
    }

    if(!!schedule && !!schedule.as) {
      switch(schedule.as) {
        case 'interval':
        job.repeatEvery(schedule.spec);
        break;
        case 'once':
        job.schedule(schedule.spec);
        break;
        case 'immediate':
        job.schedule(now);
        break;
      }
    }
    else { // immediately
      job.schedule(now);
    }

    job.save(function (err) {
      if(err) return cb(err);

      var jobId = job.attrs._id;

      me.findOneAndUpdate(
        { userId: userId, jobId: jobId },
        { userId: userId, jobId: jobId },
        { upsert: true },
        function (err, doc) {
          if(err)  return cb(err);
          if(!doc) return cb(new Error('Could not associate user with job.'));
          doc.save(function() { // only to signal events to update this via sockets (if used)
            cb(null, job);
          });
        }
      );
    });
  }
};

module.exports = mongoose.model('UserJob', UserJobSchema);