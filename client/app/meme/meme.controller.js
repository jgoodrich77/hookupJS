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
    ['/assets/images/meme-generator/bg-01.jpg', 'Image 1'],
    ['/assets/images/meme-generator/bg-02.jpg', 'Image 2'],
    ['/assets/images/meme-generator/bg-03.jpg', 'Image 3'],
    ['/assets/images/meme-generator/bg-04.jpg', 'Image 4'],
    ['/assets/images/meme-generator/bg-05.jpg', 'Image 5'],
    ['/assets/images/meme-generator/bg-06.jpg', 'Image 6'],
    ['/assets/images/meme-generator/bg-07.jpg', 'Image 7'],
    ['/assets/images/meme-generator/bg-08.jpg', 'Image 8'],
    ['/assets/images/meme-generator/bg-09.jpg', 'Image 9'],
    ['/assets/images/meme-generator/bg-10.jpg', 'Image 10'],
    ['/assets/images/meme-generator/bg-11.jpg', 'Image 11'],
    ['/assets/images/meme-generator/bg-12.jpg', 'Image 12'],
    ['/assets/images/meme-generator/bg-13.jpg', 'Image 13'],
    ['/assets/images/meme-generator/bg-14.jpg', 'Image 14'],
    ['/assets/images/meme-generator/tile-1.png', 'Tile 1'],
    ['/assets/images/meme-generator/tile-2.png', 'Tile 2'],
    ['/assets/images/meme-generator/tile-3.png', 'Tile 3']
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