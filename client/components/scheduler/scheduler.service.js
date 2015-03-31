'use strict';

angular
.module('auditpagesApp')

.factory('ScheduleDataLoader', function ($q) {

  function ScheduleDataLoader() {
    this.reset();
  }

  Object.defineProperties(ScheduleDataLoader.prototype, {
    loading: {
      get: function() { return this._loading; }
    },
    softLoading: {
      get: function() { return  this._hasLoaded && this.loading; }
    },
    fullLoading: {
      get: function() { return !this._hasLoaded && this.loading; }
    }
  });

  ScheduleDataLoader.prototype.reset = function () {
    this._hasLoaded = false;
    this._loading = false;
  };

  ScheduleDataLoader.prototype.query = function(dateRange) { // should be implemented by child class
    return [];
  };

  ScheduleDataLoader.prototype.load = function(dateRange) {
    this._loading = true;
    return $q.when(this.query(dateRange))
      .then((function (data) {
        return data;
      }).bind(this))
      .finally((function () {
        this._loading = false;
        this._hasLoaded = true;
      }).bind(this));
  };

  return ScheduleDataLoader;
})

.factory('ScheduleDataFuture', function ($http, ScheduleDataLoader) {

  function ScheduleDataFuture() {
    ScheduleDataLoader.call(this);
  }

  ScheduleDataFuture.prototype = new ScheduleDataLoader;
  ScheduleDataFuture.prototype.constructor = ScheduleDataFuture;

  Object.defineProperties(ScheduleDataFuture.prototype, {
  });

  ScheduleDataFuture.prototype.query = function (dateRange) {
    return $http.get('/api/user-schedule/posts-pending', {
      params: {
        dateStart: dateRange.from,
        dateEnd: dateRange.to
      }
    }).then(function (results) {
      return results.data.map(function (result) {
        result.date = result.scheduledFor;
        return result;
      });
    });
  };

  return ScheduleDataFuture;
})

.factory('ScheduleDataFB', function ($fb, $filter, Calendar, ScheduleDataLoader) {

  function ScheduleDataFB(fbObjectId, fbAuthToken) {
    ScheduleDataLoader.call(this);
    this.fbObjectId  = fbObjectId;
    this.fbAuthToken = fbAuthToken;
  }

  ScheduleDataFB.prototype = new ScheduleDataLoader;
  ScheduleDataFB.prototype.constructor = ScheduleDataFB;

  Object.defineProperties(ScheduleDataFB.prototype, {
    fbObjectId: {
      get: function() { return this._facebookObjectId; },
      set: function(v) { this._facebookObjectId = v; }
    },
    fbAuthToken: {
      get: function() { return this._facebookAuthToken; },
      set: function(v) { this._facebookAuthToken = v; }
    },
    valid: {
      get: function() { return !!this.fbObjectId && !!this.fbAuthToken; }
    }
  });

  ScheduleDataFB.fixFacebookDate = function (date) {
    // var fixedStr = (date||'').replace('+0000','.000Z');
    return new Date(date);
  };

  ScheduleDataFB.prototype.query = function (dateRange) {
    if(!this.valid) return false;
    return $fb.getObjectPosts({
      id: this.fbObjectId,
      access_token: this.fbAuthToken,
    }, dateRange.from, dateRange.to, ['id', 'updated_time', 'created_time', 'status_type', 'type'])
      .then(function (results) {
        return results.data.map(function (post) { // facebook sends us weird dates, fix them:
          post.date = ScheduleDataFB.fixFacebookDate(post.created_time);
          return post;
        });
      });
  };

  return ScheduleDataFB;
})

.factory('ScheduleDataAggr', function (ScheduleDataFB, ScheduleDataFuture, ScheduleDataLoader) {

  function ScheduleDataAggr(calendar, fbObjectId, fbAuthToken) {
    ScheduleDataLoader.call(this, calendar);

    this.loaderFb     = new ScheduleDataFB(calendar, fbObjectId, fbAuthToken);
    this.loaderFuture = new ScheduleDataFuture(calendar);
  }

  ScheduleDataAggr.prototype = new ScheduleDataLoader;
  ScheduleDataAggr.prototype.constructor = ScheduleDataAggr;

  ScheduleDataAggr.prototype.query = function (dateRange) {
    var
    now            = new Date,
    includesFuture = dateRange.to   > now,
    includesPast   = dateRange.from < now;

    if(!includesFuture) { // historical only view
      return this.loaderFb.query(dateRange);
    }
    else if(!includesPast) { // future only view
      return this.loaderFuture.query(dateRange);
    }
    else { // aggregated view
      return this.loaderFuture.query(dateRange)
        .then((function (futureData) {

          var aggregated = [];

          if(futureData) {
           Array.prototype.push.apply(aggregated, futureData);
          }

          return this.loaderFb.query(dateRange)
            .then(function (facebookData) {
             Array.prototype.push.apply(aggregated, facebookData);
             return aggregated;
            });
        }).bind(this));
    }
  };

  return ScheduleDataAggr;
});