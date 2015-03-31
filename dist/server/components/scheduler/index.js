'use strict';

var
Action = require('./lib/action'),
Queue = require('./lib/queue'),
TimeSlot = require('./lib/time-slot');

function Scheduler() {

  var
  queue = new Queue();

  this.schedule = function(action, timeSlot) {
    return queue.add(action, timeSlot);
  }
}

// convienence refs
Scheduler.TimeSlot = TimeSlot;
Scheduler.Action   = Action;
Scheduler.Queue    = Queue;

// final export
module.exports = Scheduler;