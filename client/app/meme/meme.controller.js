'use strict';

angular
.module('auditpagesApp')
.controller('MemeCtrl', function (ImageGenerator, $scope) {

  var imageGen = $scope.imageGenerator = new ImageGenerator();

  $scope.fontsAvail = [
    'Open Sans',
    'Droid Sans',
    'Slabo 27px',
    'Oswald',
    'Lato',
    'Yanone Kaffeesatz'
  ].map(function(f) { return ['"' + f + '"', f]; });

  $scope.alignments = [
    ['left', 'Left'],
    ['center', 'Center'],
    ['right', 'Right']
  ];

  $scope.width = 640;
  $scope.height = 320;

  $scope.backgroundImgType = 'preset';
  $scope.backgroundImgs = [
    ['https://dl.dropboxusercontent.com/u/48498161/codepen/ZYKyxd/bg-1.jpg', 'Image 1'],
    ['https://dl.dropboxusercontent.com/u/48498161/codepen/ZYKyxd/bg-2.jpg', 'Image 2'],
    ['https://dl.dropboxusercontent.com/u/48498161/codepen/ZYKyxd/bg-3.jpg', 'Image 3'],
    ['https://dl.dropboxusercontent.com/u/48498161/codepen/ZYKyxd/tile-1.png', 'Tile 1'],
    ['https://dl.dropboxusercontent.com/u/48498161/codepen/ZYKyxd/tile-2.png', 'Tile 2'],
    ['https://dl.dropboxusercontent.com/u/48498161/codepen/ZYKyxd/tile-3.png', 'Tile 3']
  ];

  $scope.$watch('backgroundImgType', function (type) {
    $scope.backgroundColor = undefined;
    $scope.backgroundImg = undefined;

    if((type === 'preset' || type === 'custom')) {
      $scope.backgroundImgPos = $scope.backgroundImgPos || 'cover';
    }
    else {
      $scope.backgroundImgPos = undefined;
    }

    if(type === 'preset') {
      $scope.backgroundImg = $scope.backgroundImgs[0][0];
    }
    else if(type === 'solid' ) {
      $scope.backgroundColor = 'rgba(36,36,36,0.75)';
    }
  });

  $scope.$watch('backgroundImgPos', imageGen.setBackgroundPosition.bind(imageGen));
  $scope.$watch('backgroundImg', imageGen.setBackground.bind(imageGen));
  $scope.$watch('backgroundColor', imageGen.setBackgroundColor.bind(imageGen));
  $scope.$watch('width', imageGen.setWidth.bind(imageGen));
  $scope.$watch('height', imageGen.setHeight.bind(imageGen));
  $scope.$watch(function() {
    $scope.imageGenerator.redraw();
  });

  var
  margin = 10,
  fontSizeLarge = 50,
  fontSizeSmall = 25;

  imageGen.addLayer({
    name: 'Top Text',
    expanded: true,
    color: '#EFF553',
    text: 'Image Title Here',
    font: '"Oswald"',
    fontSize: fontSizeLarge,
    align: 'center',
    width: $scope.width - (margin * 2),
    height: fontSizeLarge,
    autoSize: false,
    position: {
      x: margin,
      y: margin
    }
  });

  imageGen.addLayer({
    name: 'Bottom Text',
    color: '#ffffff',
    text: 'Here you can put some meaningful text below the image title. Perhaps a brand slogan?',
    font: '"Yanone Kaffeesatz"',
    fontSize: fontSizeSmall,
    align: 'right',
    autoSize: true,
    position: {
      x: 267,
      y: 241
    }
  });

  imageGen.addLayer({
    name: 'HookupJS Watermark',
    imageUrl: '/assets/images/hookupjs-favicon.png',
    position: {
      x: 20,
      y: 270
    }
  });
});