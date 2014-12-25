'use strict';

var
Action = require('./action'),
TimeSlot = require('./time-slot');

function Queue() {

  this.validateAction = function(action) {
    if(!action instanceof Action) {
      return {
        valid: false,
        reason: 'Invalid action'
      };
    }

    var
    result = action.validate(),
    success = result.isValid();

    if(!success) {
      return {
        valid: success,
        reason: result.getReason()
      };
    }

    return {
      valid: success
    };
  };

  this.isActionValid = function(action) {
    return this.validateAction(action).valid;
  };

  this.add = function(action, timeSlot) {

    var
    validation = this.validateAction(action);

    if(!validation.valid) {
      throw new Error('Action validation failed: ' + (validation.reason||'No reason given'));
    }


    if(!timeSlot || !timeSlot instanceof TimeSlot) {
      throw new Error('Time slot provided was not a valid time slot instance.');
    }

    console.log('added action to queue');

    return true;
  };
}

module.exports = Queue;