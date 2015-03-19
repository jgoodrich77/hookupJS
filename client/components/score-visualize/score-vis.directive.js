'use strict';

angular
.module('auditpagesApp')
.directive('scoreVisualizerItem', function ($log, CacheMemory, RecursionHelper) {
  return {
    restrict: 'E',
    replace: true,
    template: [
      '<div class="list-group-item" ng-show="isVisible(breakdown)">',
        '<div class="pull-right margin-left" ng-show="!!breakdown.expanded.length">',
          '<a href class="btn btn-default" ng-click="toggleExpanded(breakdown)">',
            '<span class="glyphicon" ng-class="{\'glyphicon-minus\': breakdown.isExpanded, \'glyphicon-plus\': !breakdown.isExpanded}"></span>',
          '</a>',
        '</div>',
        '<div class="badge" style="font-size: 23px; line-height: 25px">{{breakdown.score * 100 | percentage:2}}</div>',
        '<h4 ng-bind="breakdown.label" ng-if="!breakdown.isPostItem"></h4>',

        '<div class="plist-group-item-text" ng-if="breakdown.isPostItem">',
          '<h5 ng-bind="breakdown.detail.message"></h5>',

          '<div ng-if="breakdown.isExpanded">',
          '</div>',

          //'<pre ng-bind="breakdown.detail | json"></pre>',
        '</div>',
        '<div class="clearfix"></div>',

        '<div class="list-group margin-top" ng-if="breakdown.expanded.length && breakdown.isExpanded" ng-repeat="item in breakdown.expanded">',
          '<score-visualizer-item breakdown="item"></score-visualizer-item>',
        '</div>',

        // '<pre ng-bind="breakdown|json"></pre>',
      '</div>'
    ].join(''),
    scope: {
      breakdown: '='
    },
    compile: function (element) {
      return RecursionHelper.compile(element, {
        post: function (scope, el, attrs) {

          scope.isVisible = function(breakdown) {
            return !!breakdown && breakdown.score !== undefined;
          };
          scope.toggleExpanded = function(breakdown) {
            breakdown.isExpanded = !breakdown.isExpanded;
          };
        }
      });
    }
  };
})
.directive('scoreVisualizer', function ($log, $fb) {
  return {
    restrict: 'E',
    replace: true,
    template: [
      '<div ng-show="score.status == \'finished\'">',
        '<div><label>Total Score:</label> {{score.result.score * 100 | percentage:2}}</div>',
        '<div class="list-group" ng-repeat="item in score.result.explained">',
          '<score-visualizer-item breakdown="item"></score-visualizer-item>',
        '</div>',
      '</div>'
    ].join(''),
    scope: {
      score: '='
    },
    link: function (scope, el, attrs) {

      scope.$watch('score', function (nV) {
        if(!nV) return;

        var
        postScores = nV.result.explained[1],
        postScoresExp = postScores.expanded || [];

        postScores.isPosts = true;

        if(postScoresExp && postScoresExp.length) {

          postScoresExp.forEach(function (obj) {
            if(obj.total !== undefined) return; // skip

            obj.isPostItem = true;

            $fb.getObjectInfo({id: obj.label})
              .then(function (results) {
                obj.detail  = results;
                return results;
              });
          });

          // console.log('postScoresExp:', postScoresExp);
        }

        // console.log('postScores:', postScores);
      });

    }
  };
});