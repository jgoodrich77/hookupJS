'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var
UserScheduleSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  jobId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true
  },
  facebookObjectId: {
    type: String,
    required: true,
    index: true
  },
  scheduledFor: {
    type: Date,
    required: true
  }
});

var
forceObjectId = mongoose.Types.ObjectId.bind(mongoose.Types);

var
MS_PER_DAY = 8.64e7,
DAY_PER_WEEK = 7,
DEFAULT_BOW = 0; // sunday

function dateRangeWeek(year, weekNumber, boW) {
  boW = isNaN(boW) ? DEFAULT_BOW : boW;

  if(weekNumber < 1) weekNumber = 1;

  var now = new Date(year, 0, 1);

  now.setHours(0,0,0);
  now.setDate(now.getDate()+boW-(now.getDay()||DAY_PER_WEEK));
  now.setTime(now.getTime() + (MS_PER_DAY * DAY_PER_WEEK * (weekNumber - 1)));

  return {
    start: now,
    end:   new Date(now.getTime() + ((MS_PER_DAY * DAY_PER_WEEK) - 1))
  }
}

function normDate(v) {
  if(v instanceof Date) return v;
  var ms = Date.parse(v);
  return isNaN(ms) ? false : new Date(ms);
}

function relativeDateNext(minDate, maxDate, previousDates) {
  var
  sMs = normDate(minDate).getTime(),
  eMs = normDate(maxDate).getTime();

  if(sMs > eMs) { // flip around
    var peMs = eMs;
    eMs = sMs;
    sMs = peMs;
  }

  if(!previousDates || !previousDates.length) {
    return new Date(sMs);
  }

  var
  lastMs = previousDates
    .reduce(function (p, c) {
      var date = normDate(c);

      if(!date) return p;

      var ms = date.getTime();

      if(!p || p < ms) {
        p = ms;
      }

      return p;
    }, false);

  if(!lastMs) {
    return new Date(sMs);
  }

  var
  chunkSize = Math.floor((eMs - sMs) / 3),
  nextMs = lastMs + chunkSize;

  if(nextMs > eMs) {
    console.log('date (%s) exceeds max date for this period.', new Date(nextMs));
    return new Date(nextMs);
  }

  return new Date(nextMs);
}

UserScheduleSchema.statics = {
  nukeUserSchedules: function (agenda, userId, cb) {
    var me = this;

    this.findAllUserScheduledJobIds(userId, function (err, jobs) {
      if(err) return cb(err);
      if(!jobs || !jobs.length) return cb(null, true);

      // cancel matching agenda jobs
      agenda.cancel({
        _id: { '$in': jobs }
      }, function (err) {
        if(err) return cb(err);

        // delete matching user jobs
        me.find({ user: userId})
          .remove(function (err) {
            if(err) return cb(err);

            cb(null, true);
          });
      });
    });
  },

  findAllUserScheduledJobIds: function(userId, cb) {
    this.find({ user: userId }, 'jobId', function (err, jobs) {
      if(err) return cb(err);
      if(!jobs || !jobs.length) return cb(null, jobs);

      cb(null, jobs.map(function (j) {
        return forceObjectId(j.jobId);
      }));
    });
  },

  findDetail: function(agenda, userId, jobId, cb) {
    this.findOne({ /*user: userId, */ jobId: jobId }, function (err, doc) {
      if(err) return cb(err);
      if(!doc) return cb(null);

      agenda.jobs({ _id: forceObjectId(jobId) }, function (err, docs) {
        if(err) return cb(err);
        if(!docs || !docs.length) return cb(null);
        return cb(null, docs[0]);
      });
    });
  },
  cancelJob: function(agenda, userId, jobId, cb) {
    this.findOne({ user: userId, jobId: jobId }, function (err, doc) {
      if(err) return cb(err);
      if(!doc) return cb(null);

      doc.remove(function (err) {
        if(err) return cb(err);
        agenda.cancel({ _id: forceObjectId(jobId) }, cb);
      });
    });
  },
  createJob: function(agenda, userId, type, data, date, cb) {
    var
    job = agenda.create(type, data),
    now = new Date,
    me = this;

    if(!job) {
      return cb(new Error('Could not create requested job'));
    }

    job.schedule(date);
    job.save(function (err) {
      if(err) return cb(err);

      var jobId = job.attrs._id;

      me.findOneAndUpdate(
        { user: userId, jobId: jobId },
        {
          user: userId,
          jobId: jobId,
          facebookObjectId: data.facebookObjectId,
          scheduledFor: date
        },
        { upsert: true },
        function (err, doc) {
          if(err)  return cb(err);
          if(!doc) return cb(new Error('Could not associate user with job.'));
          cb(null, job);
        }
      );
    });
  },
  findNextSlot: function(userId, startDate, endDate, cb) {
    return this.find({
      user: userId,
      scheduledFor: {
        '$gte': startDate,
        '$lte': endDate
      }
    }, function (err, docs) {
      if(err) return cb(err);
      if(!docs) return cb(null, startDate);

      var now = new Date();

      if(startDate.getTime() < now.getTime()) {
        startDate = now;
      }

      cb(null, relativeDateNext(startDate, endDate, docs.map(function (doc) {
        return doc.scheduledFor;
      })));
    });
  },
  findByDateRange: function(dateStart, dateEnd, extraCriteria, cb) {
    var
    criteria = {
      scheduledFor: {
        '$gte': dateStart,
        '$lte': dateEnd
      }
    };

    if(!!extraCriteria) {
      Object.keys(extraCriteria).forEach(function (key) {
        criteria[key] = extraCriteria[key];
      });
    }

    return this
      .find(criteria)
      .sort({ scheduledFor: 1 })
      .populate('user', '_id name')
      .exec(cb);
  },
  findByUserDateRange: function(userId, dateStart, dateEnd, cb) {
    return this.findByDateRange(dateStart, dateEnd, { user: userId }, cb);
  },
  findByObjectDateRange: function(objectId, dateStart, dateEnd, cb) {
    return this.findByDateRange(dateStart, dateEnd, { facebookObjectId: objectId }, cb);
  },
  findByUserYearWeek: function(userId, year, week, cb) {
    var dateRange = dateRangeWeek(year, week);
    return this.findByUserDateRange(userId, dateRange.start, dateRange.end, cb);
  },
  findByObjectYearWeek: function(objectId, year, week, cb) {
    var dateRange = dateRangeWeek(year, week);
    return this.findByObjectDateRange(objectId, dateRange.start, dateRange.end, cb);
  }
};

module.exports = mongoose.model('UserSchedule', UserScheduleSchema);