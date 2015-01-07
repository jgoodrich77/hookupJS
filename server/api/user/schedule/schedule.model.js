'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var
UserScheduleSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobId: {
    type: Schema.Types.ObjectId,
    required: true
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
  findDetail: function(agenda, userId, jobId, cb) {
    this.findOne({ userId: userId, jobId: jobId }, function (err, doc) {
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
    this.findOne({ userId: userId, jobId: jobId }, function (err, doc) {
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
        { userId: userId, jobId: jobId },
        { userId: userId, jobId: jobId, scheduledFor: date },
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
      userId: userId,
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
  findByYearWeek: function(userId, year, week, cb) {
    var dateRange = dateRangeWeek(year, week);

    return this.find({
      userId: userId,
      scheduledFor: {
        '$gte': dateRange.start,
        '$lte': dateRange.end
      }
    }).sort({
      scheduledFor: 1
    }).exec(cb);
  }
};

module.exports = mongoose.model('UserSchedule', UserScheduleSchema);