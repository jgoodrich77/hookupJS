'use strict';

angular
.module('auditpagesApp')
.factory('CacheMemory', function() {
  function CacheMemory() {
    var cache = {};

    this.set = function(key, buffer) {
      return cache[key] = buffer;
    };
    this.has = function(key) {
      return cache.hasOwnProperty(key);
    };
    this.get = function(key) {
      return cache[key];
    };
    this.getAll = function() {
      return cache;
    };
    this.unset = function(key) {
      delete cache[key];
      return this;
    };
    this.reset = function() {
      Object.keys(cache).forEach(this.unset.bind(this));
      return this;
    };
  }

  return CacheMemory;
});