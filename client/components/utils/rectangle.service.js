'use strict';

angular
.module('auditpagesApp')
.service('$rect', function () {
  return {
    aspectRatio: function (w, h) {
      return h / w;
    },
    isSquare: function (w, h) {
      return w === h;
    },
    isPortrait: function (w, h) {
      return w < h;
    },
    isLandscape: function (w, h) {
      return w > h;
    },
    stretch: function(dw, dh, sw, sh) {
      return {
        x: 0,
        y: 0,
        w: dw,
        h: dh
      };
    },
    fit: function (dw, dh, sw, sh) {
      if(isNaN(dw)||isNaN(dh)||isNaN(sw)||isNaN(sh)) return {};

      var
      x = 0, y = 0, w = dw, h = dh;

      var scale = Math.min(dw / sw, dh / sh);

      w = sw * scale;
      h = sh * scale;
      x = (dw / 2) - (w / 2);
      y = (dh / 2) - (h / 2);

      return {
        x: Math.round(x),
        y: Math.round(y),
        w: Math.round(w),
        h: Math.round(h)
      };
    },
    cover: function (dw, dh, sw, sh) {
      if(isNaN(dw)||isNaN(dh)||isNaN(sw)||isNaN(sh)) return {};

      var
      x = 0, y = 0, w = dw, h = dh;

      var scale = Math.max(dw / sw, dh / sh);

      w = sw * scale;
      h = sh * scale;
      x = (dw / 2) - (w / 2);
      y = (dh / 2) - (h / 2);

      return {
        x: Math.round(x),
        y: Math.round(y),
        w: Math.round(w),
        h: Math.round(h)
      };
    }
  };
});