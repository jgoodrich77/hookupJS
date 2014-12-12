'use strict';

angular
.module('auditpagesApp')
.factory('FancyCountdown', function ($window, $timeout) {

  var
  requestAF = $window.requestAnimationFrame,
  cancelAF = $window.cancelAnimationFrame;

  (function() { // shim adapted from: https://gist.github.com/paulirish/1579671 (does not contaminate $window!)
    var
    lastTime = 0,
    vendors = ['ms', 'moz', 'webkit', 'o'];

    for(var x = 0; x < vendors.length && !requestAF; ++x) {
      requestAF = $window[vendors[x]+'RequestAnimationFrame'];
      cancelAF = $window[vendors[x]+'CancelAnimationFrame'] || $window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!requestAF)
      requestAF = function(callback, element) {
        var
        currTime = new Date().getTime(),
        timeToCall = Math.max(0, 16 - (currTime - lastTime)),
        id = $timeout(function() { callback(currTime + timeToCall); }, timeToCall);
        lastTime = currTime + timeToCall;
        return id;
      };

    if (!cancelAF)
      cancelAF = function(id) {
        $timeout.cancel(id);
      };
  }());

  return function FancyCountdown(scope, opts) {
    opts = opts || {};

    var
    me = this,
    eventNs = 'FancyCountdown',
    autoStart = !!opts.autoStart,
    running = false,
    paused = false,
    finished = false,
    usingAF, lHandle, lTick;

    // defaults
    me.id        = opts.id || null;
    me.useFrame  = usingAF = opts.useFrame || false;
    me.delay     = opts.delay || 0;
    me.interval  = opts.interval || 500;
    me.remainder = parseInt(opts.remainder || 0);

    function nowMs() {
      return (new Date).getTime();
    }

    function tick() {
      var
      now = nowMs(),
      lT = lTick || now;

      if(!running || !!paused || (now - lT) < me.interval) return (lTick === undefined);

      me.remainder = Math.max(me.remainder - (now - lT), 0);

      if(me.remainder === 0) {
        me.stop(true);
      }

      return true; // mark this tick
    }

    var
    scopedLoop = function() {
      scope.$apply(loop);
    };

    function loop() {
      if(!running) return;

      if(usingAF) {
        lHandle = requestAF(scopedLoop);
      }
      else {
        lHandle = $timeout(scopedLoop, me.interval);
      }

      if(tick()) {
        lTick = nowMs();
      }
    }

    function cancelLoop() {
      if(!lHandle) return;

      if(usingAF) {
        cancelAF(lHandle);
      }
      else {
        $timeout.cancel(lHandle);
      }
    }

    // public methods
    me.start = function() {
      if(!!running) return;

      running = true;
      paused = false;
      finished = false;
      lTick = undefined;
      me.remainder = parseInt(me.delay);
      usingAF = !!me.useFrame;
      scope.$emit(eventNs + ':start', me);
      loop();
    };
    me.stop = function(hasFinished) {
      if(!running) return;

      running = false;
      paused = false;
      cancelLoop();
      lTick = undefined;
      me.remainder = 0;
      scope.$emit(eventNs + ':stop', me);

      if(hasFinished) {
        finished = true;
        scope.$emit(eventNs + ':complete', me);
      }
    };
    me.pause = function() {
      if(!!paused) return;

      paused = true;
      cancelLoop();
      lTick = undefined;
      scope.$emit(eventNs + ':pause', me);
    };
    me.resume = function() {
      if(!paused) return;

      paused = false;
      lTick = undefined;
      loop();
      scope.$emit(eventNs + ':resume', me);
    };
    me.isRunning = function() {
      return !!running;
    };
    me.isPaused = function() {
      return !!paused;
    };
    me.isActive = function() {
      return me.isRunning() && !me.isPaused();
    };

    if(autoStart) {
      me.start();
    }
  };
})
.directive('fancyCountdown', function($window, $timeout) {

  function splitMs(v) {
    if(v === undefined || v===false || v===null) return {};
    v = parseFloat(v);
    return {
      hr  : Math.floor(((v / (1000*60*60)))),
      min : Math.floor(((v / (1000*60)) % 60)),
      sec : Math.floor((v / 1000) % 60),
      ms  : Math.floor(v % 1000)
    };
  }

  function padNum(n, places, force) {
    n = parseInt(n);
    if(!force && n === 0) return false;

    var
    ref    = Math.pow(10, places - 1),
    refStr = String(ref),
    nStr   = String(n);

    if(n < ref) {
      return refStr.substring(1, 1 + (refStr.length - nStr.length)) + n;
    }

    return String(n);
  }

  return {
    restrict: 'A',
    template: [
      '<span class="numbers hours" ng-if="model.hours"><label ng-bind="model.hours"></label><em class="separator">:</em></span>',
      '<span class="numbers minutes" ng-if="model.minutes"><label ng-bind="model.minutes"></label><em class="separator">:</em></span>',
      '<span class="numbers seconds" ng-if="model.seconds"><label ng-bind="model.seconds"></label><em class="separator">.</em></span>',
      '<span class="numbers msec" ng-if="model.msec"><label ng-bind="model.msec"></label></span>'
    ].join(''),
    link: function($scope, el, attrs) {

      var
      watchHdl,
      viewProp = 'model';

      $scope[viewProp] = {};
      $scope.$watch(attrs.fancyCountdown, function (ctrl) {
        if(!ctrl) return;

        if(watchHdl) { // clean up previous controlled
          watchHdl(); // kill other watcher
        }

        watchHdl = $scope.$watch(function(){
          return ctrl.remainder;
        },function(nV, oV) {
          // console.log('watch2', nV, oV);
          var
          hmsms = splitMs(nV),
          m = $scope[viewProp];
          m.hours   = padNum(hmsms.hr, 2);
          m.minutes = padNum(hmsms.min, 2);
          m.seconds = padNum(hmsms.sec, 2, true);
          m.msec    = padNum(hmsms.ms, 3, true);
        });
      });
    }
  };
});
