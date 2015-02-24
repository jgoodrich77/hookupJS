'use strict';

angular
.module('auditpagesApp')
//
// Interesting note. If you're using images outside the domain,
// we run into COORS issues with saving image data.
// http://stackoverflow.com/questions/13674835/canvas-tainted-by-cross-origin-data
//
.factory('ImageCORS', function () {
  var brokenImage;

  function ImageCORS () {
    var image = new Image;
    image.crossOrigin = "Anonymous";
    image.addEventListener('error', function (err) {
      image.src = brokenImage.src;
    });

    return image;
  };

  // handles broken image displaying
  brokenImage = new ImageCORS();
  brokenImage.src = '/assets/meme-generator/broken.png';

  return ImageCORS;
})
.factory('ImageGeneratorLayer', function ($rect, $q, ImageCORS) {
  function ImageGeneratorLayer(generator, opts) {
    angular.extend(this, opts || {});
    this.generator = generator;
    if(this.autoSize === undefined) {
      this.autoSize = true;
    }
    if(this.visible === undefined) {
      this.visible = true;
    }
  }

  function horizontalAlign(w1, w2, alignment) {
    alignment = alignment || 'left';
    switch(alignment.toLowerCase()) {
      case 'center': return (w1 / 2) - (w2 / 2);
      case 'right': return w1 - w2;
      default: return 0;
    }
  }

  function wrapLines(ctx, text, maxWidth, lineHeight, x, y, alignment) {
    x = x || 0;
    y = y || 0;
    alignment = alignment || 'left';

    var
    words = text.split(' '),
    lines = [],
    cLine = '',
    cWidth = 0,
    pushLine = function () {
      lines.push({
        text: cLine,
        x: x + horizontalAlign(maxWidth, cWidth, alignment),
        y: y + (lines.length + 1) * lineHeight
      });
    };

    words.forEach(function(w, n) {
      var
      testCLine = cLine + (cLine === '' ? '' : ' ') + w,
      testCWidth = ctx.measureText(testCLine).width;

      if(testCWidth > maxWidth && n > 0) {
        pushLine(); // wrapped line
        cLine = w;
        cWidth = ctx.measureText(w).width;
      }
      else {
        cLine = testCLine;
        cWidth = testCWidth;
      }
    });

    pushLine(); // anything else buffered

    return lines;
  }

  function measureTextWrapped(ctx, text, maxWidth, lineHeight) {
    var
    virtLines = wrapLines(ctx, text, maxWidth, lineHeight),
    totalHeight = virtLines.length * lineHeight,
    maxWidth = virtLines.reduce(function(p, c) {
      return Math.max(p, ctx.measureText(c.text).width);
    }, 0);

    return {
      width: maxWidth,
      height: totalHeight
    };
  };

  function textWrapped(ctx, text, x, y, maxWidth, lineHeight, alignment) {
    return wrapLines(ctx, text, maxWidth, lineHeight, x, y, alignment)
      .forEach(function (line) {
        ctx.fillText(line.text, line.x, line.y);
      });
  };

  ImageGeneratorLayer.prototype.imageCache = function(imageUrl) {
    if(this.$imageBuffer === undefined) {
      this.$imageBuffer = {};
    }

    var img = this.$imageBuffer[imageUrl], genny = this.generator;

    if(img === undefined) {
      img = this.$imageBuffer[imageUrl] = new ImageCORS();
      img.src = imageUrl;
    }

    return img;
  };

  ImageGeneratorLayer.prototype.render = function(ctx, w, h) {
    if(!this.visible) return;

    var
    pos = this.position || {},
    posX = pos.x || 0,
    posY = pos.y || 0,
    width = this.width || 0,
    height = this.height || 0,
    font = this.font || 'Sans',
    fontSize = this.fontSize || 18;

    ctx.strokeStyle = this.color;

    if(this.text) {
      ctx.font = fontSize + 'px ' + font;

      var
      textDimensions = measureTextWrapped(ctx, this.text, w - posX, fontSize),
      textWidth = textDimensions.width,
      textHeight = textDimensions.height;

      if(this.autoSize) {
        this.width = Math.ceil(textWidth);
        this.height = Math.ceil(textHeight);
      }

      ctx.fillStyle = this.color;
      textWrapped(ctx, this.text, posX, posY, this.width, fontSize, this.align);
    }
    else if(this.imageUrl) {
      var
      image = this.imageCache(this.imageUrl),
      doDraw = (function () {
        if(this.autoSize) {
          this.width = image.width;
          this.height = image.height;
        }

        ctx.drawImage(image, posX, posY, this.width, this.height);
      }).bind(this);

      if(image.complete) {
        doDraw();
      }
      else {
        image.onload = doDraw;
      }
    }

    if(this.showBorder) {
      ctx.strokeRect(posX, posY, width, height);
    }
  };

  return ImageGeneratorLayer;
})

.factory('ImageGenerator', function ($timeout, $rect, ImageGeneratorLayer, ImageCORS) {

  function uId() {
    return 'image-gen-' + (new Date).getTime();
  };

  function ImageGenerator () {
    this.redraw();
    this.layers = [];
    this.id = uId();
  }

  ImageGenerator.prototype.getId = function () {
    return this.id;
  };

  ImageGenerator.prototype.addLayer = function (opts) {
    this.layers.push(new ImageGeneratorLayer(this, opts));
    return this.layers[this.layers.length - 1];
  };
  ImageGenerator.prototype.removeLayer = function (index) {
    this.layers.splice(index, 1);
  };

  ImageGenerator.prototype.setBackground = function (v) {
    if(!v) {
      this.background = undefined;
      this.redraw();
      return this;
    }

    this.background = new ImageCORS();
    this.background.src = v;
    this.background.onload = this.redraw.bind(this);
    this.redraw();
    return this;
  };

  ImageGenerator.prototype.setBackgroundColor = function (v) {
    if(!v) {
      this.backgroundColor = undefined;
      this.redraw();
      return this;
    }

    this.backgroundColor = v;
    this.redraw();
    return this;
  };

  ImageGenerator.prototype.setBackgroundPosition = function (v) {
    this.backgroundPosition = v;
    this.redraw();
    return this;
  };

  ImageGenerator.prototype.getBackgroundPosition = function () {
    return this.backgroundPosition;
  };

  ImageGenerator.prototype.getBackground = function () {
    return this.background;
  };

  ImageGenerator.prototype.getBackgroundColor = function () {
    return this.backgroundColor;
  };

  ImageGenerator.prototype.getCanvas = function () {
    return this.canvas;
  };

  ImageGenerator.prototype.getContext = function () {
    return this.context;
  };

  ImageGenerator.prototype.setCanvas = function (canvasEl) {
    this.canvas = canvasEl;
    this.context = this.canvas.getContext('2d');
    this.pullDimensions();
    this.redraw();
    return this;
  };

  ImageGenerator.prototype.setWidth = function (width) {
    this.width = width;
    this.pushDimensions();
    return this;
  };

  ImageGenerator.prototype.setHeight = function (height) {
    this.height = height;
    this.pushDimensions();
    return this;
  };

  ImageGenerator.prototype.redraw = function () {
    var
    ctx = this.context,
    bgColor = this.getBackgroundColor(),
    bgPos   = this.getBackgroundPosition() || 'cover',
    bg = this.getBackground();
    if(!ctx) return;

    ctx.clearRect(0, 0, this.width, this.height);

    if(bgColor) { // draw solid background color
      ctx.save();
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }

    if(bg && bg.complete) { // draw background
      ctx.save();

      if(bgPos === 'cover' || bgPos === 'fit' || bgPos === 'stretch') {
        var coord;

        if(bgPos === 'fit') {
          coord = $rect.fit(this.width, this.height, bg.width, bg.height);
        }
        else if(bgPos === 'stretch') {
          coord = $rect.stretch(this.width, this.height, bg.width, bg.height);
        }
        else {
          coord = $rect.cover(this.width, this.height, bg.width, bg.height);
        }

        ctx.drawImage(bg, coord.x, coord.y, coord.w, coord.h);
      }
      else if (bgPos === 'repeat') {
        ctx.fillStyle = ctx.createPattern(bg,'repeat');
        ctx.fillRect(0, 0, this.width, this.height);
      }

      ctx.restore();
    }

    this.layers.forEach((function(layer){
      ctx.save();
      layer.render(ctx, this.width, this.height);
      ctx.restore();
    }).bind(this));

    return this;
  };

  ImageGenerator.prototype.pushDimensions = function () {
    if(!this.canvas) return;

    var
    canv = this.canvas;

    canv.setAttribute('width', this.width),
    canv.setAttribute('height', this.height);
    this.redraw();

    return this;
  };

  ImageGenerator.prototype.pullDimensions = function () {
    if(!this.canvas) return;

    var
    canv = this.canvas,
    cW = canv.getAttribute('width'),
    cH = canv.getAttribute('height');

    this.width = cW || 320;
    this.height = cH || 240;

    if(this.width !== cW || this.height !== cH) {
      this.pushDimensions();
    }
    return this;
  };

  return ImageGenerator;
})
.directive('imageGeneratorCanvas', function ()  {
  return {
    replace: true,
    restrict: 'E',
    template: '<canvas id="{{uniqueId}}">Canvas is not supported by your browser.</canvas>',
    scope: {
      ctrl: '=igcController',
      width:'@',
      height:'@'
    },
    link: function(scope, el, attrs) {
      scope.width = attrs.width || 320;
      scope.height = attrs.height || 240;
      scope.$watch('ctrl', function(nV) {
        if(!nV) return;
        nV.setCanvas(el[0]);
        scope.uniqueId = nV.getId();
      });
    }
  };
})
.directive('igcDownloader', function ()  {
  return {
    restrict: 'A',
    scope: {
      ctrl: '=igcDownloader',
      filename: '=igcFilename'
    },
    link: function(scope, el, attrs) {
      var
      linkEl = el[0],
      defaultFilename = 'GeneratedImage.png';

      var canvasId;

      scope.$watch('ctrl', function(nV) {
        if(!nV || !(canvasId = nV.getId())) return;
      });

      linkEl.addEventListener('click', function (evt) {
        if(!canvasId) return;

        try {
          var
          tcanvas = document.getElementById(canvasId),
          tcanvUrl = tcanvas.toDataURL();

          this.href     = tcanvUrl;
          this.download = scope.filename || defaultFilename;
        }
        catch(e) {
          console.log('error:', e);
        }
      }, false);
    }
  };
});