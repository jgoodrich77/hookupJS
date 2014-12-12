'use strict';

/**
 * Facebook model
 */
'use strict';

var
moment = require('moment'),
mongoose = require('mongoose'),
Schema = mongoose.Schema;

var
ETA_MINUTES     = 0.5,
STATUS_PENDING  = 'pending',
STATUS_RUNNING  = 'running',
STATUS_COMPLETE = 'complete',
STATUS_ERROR    = 'error';

var
FacebookScoreSchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fbObjectId: {
    type: String,
    unique: true,
    required: true
  },
  fbObjectAccessToken: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: STATUS_PENDING,
    enum: [
      STATUS_PENDING,
      STATUS_RUNNING,
      STATUS_COMPLETE,
      STATUS_ERROR
    ]
  },
  pageDetail: Object,
  result: Object,
  startDate: Date,
  finishDate: Date,
  eta: Date
});

/**
 * Validations
 */
FacebookScoreSchema
  .virtual('pageInfo')
  .get(function() {
    var
    pageDetail = this.pageDetail;

    return {
      'id':   this.fbObjectId,
      'name': pageDetail.name
    };
  });

FacebookScoreSchema
  .virtual('currentStatus')
  .get(function() {
    var
    pageDetail = this.pageDetail,
    eta = (!!this.eta && !!this.startDate && this.isRunning()) ? (
      Math.max(0, (Date.parse(this.eta) - Date.now()))
    ) : undefined;

    return {
      'page':     this.pageInfo,
      'status':   this.status,
      'result':   this.result,
      'started':  this.startDate,
      'finished': this.finishDate,
      'etaMS':    eta
    };
  });

/**
 * Statics
 */
FacebookScoreSchema.statics = {
  STATUS_PENDING:  STATUS_PENDING,
  STATUS_RUNNING:  STATUS_RUNNING,
  STATUS_COMPLETE: STATUS_COMPLETE,
  STATUS_ERROR:    STATUS_ERROR,

  calculateEta: function(now) {
    return moment(now || Date.now()).add(ETA_MINUTES, 'minutes');
  },

  findByStatus: function(status, cb) {
    return this.find({status: status}, cb);
  },

  findByObjectId: function(id, cb) {
    return this.findOne({fbObjectId: id}, cb);
  }
};

/**
 * Methods
 */
FacebookScoreSchema.methods = {
  isPending: function() {
    return this.status === STATUS_PENDING;
  },
  isRunning: function() {
    return this.status === STATUS_RUNNING;
  },
  isComplete: function() {
    return this.status === STATUS_COMPLETE;
  },
  isErrored: function() {
    return this.status === STATUS_ERROR;
  },
  hasStarted: function() {
    return !this.isPending();
  },
  hasFinished: function() {
    return this.hasStarted() && (this.isComplete() || this.isErrored());
  },
  markStarted: function() {
    if(this.hasStarted()) { // bail out!
      return false;
    }

    this.status    = STATUS_RUNNING;
    this.startDate = Date.now();
    this.eta       = FacebookScoreSchema.statics.calculateEta();
    return true;
  },
  markFinished: function(result) {
    if(!this.hasStarted() || this.hasFinished()) {
      return false;
    }

    this.status     = STATUS_COMPLETE;
    this.finishDate = Date.now();
    this.result     = result;
    return true;
  },
  markErrored: function(error) {
    if( ! this.markFinished(error) ) {
      return false;
    }

    this.status = STATUS_ERROR;
    return true;
  }
};

module.exports = mongoose.model('FacebookScore', FacebookScoreSchema);
