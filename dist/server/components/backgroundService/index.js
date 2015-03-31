'use strict';

var
Q = require('q');

module.exports = function(cfg) {
    var
    me = this,
    running = false,
    timeoutHdl;

    var // configurables
    cfgCheckInterval = 5000,
    cfgCheckFunction = function() {
      return Q([]);
    };

    me.reconfigure = function(c) {
      c = c || {};
      cfgCheckInterval = c.checkInterval || cfgCheckInterval;
      cfgCheckFunction = c.checkFunction || cfgCheckFunction;

      if(c.autoStart) {
        me.start();
      }
    };

    me.loop = function() {
      timeoutHdl = setTimeout(function() {

        if(!running) { // clean up loop
          return;
        }

        Q.promised(cfgCheckFunction)()
          .catch(function (err) {
            console.error('Service Error:', err.stack || err);
          })
          .finally(me.loop); // always start the service again, even if failed

      }, cfgCheckInterval);
    };

    me.start = function() {

      if(!!running) { // already started
        return;
      }

      running = true;
      me.loop();
    };

    me.stop = function() {

      if(!running) { // already stopped
        return;
      }

      running = false;

      if(timeoutHdl) {
        clearTimeout(timeoutHdl);
      }
    };

    me.reconfigure(cfg);
  };