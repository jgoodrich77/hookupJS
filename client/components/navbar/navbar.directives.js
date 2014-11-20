'use strict';

angular
.module('auditpagesApp')
.directive('navbarItem', function ($q, $compile, $state, Auth) {

  function tplItem(item) {

    var
    target = !!item.target ? item.target : (!!item.external ? '_blank' : false),
    icon = !!item.glyph ? '<span class="'+item.glyph+'"></span> ' : '',
    caption = item.caption||item.title,
    tpl = '<a';

    if(!!target) {
      tpl += ' target="'+ target +'"';
    }

    if(!!item.link) { // use link engine
      tpl += ' href="{{item.link}}"';
    }
    else if(!!item.state) { // use state engine
      tpl += ' ui-sref="{{item.state}}"';
    }

    if(!!item.title) { // use link engine
      tpl += ' title="{{item.title}}"';
    }

    return tpl + '>'+icon+caption+'</a>';
  }

  return {
    restrict: 'A',
    scope: {
      item: '=navbarItem'
    },
    transclude: true,
    replace: true,
    template: function(elements, attrs) {
      var tag = elements[0].nodeName;
      return '<'+tag+' ng-show="canShowItem(item)" ng-class="{active: isItemActive(item)}"></'+tag+'>';
    },
    link: function(scope, element, attrs) {

      scope.isItemActive = function(item) {
        if(!item) return false;
        return !!item.state ? $state.includes(item.state) : false;
      };

      scope.canShowItem = function(item) {
        if(!item) return false;

        if(item.roles) { // perform role testing
          var roles = item.roles;

          if(!Auth.isLoggedIn()) {
            return false;
          }

          var
          user = Auth.getCurrentUser(),
          allowed = false;

          if(angular.isArray(roles)) {
            allowed = (roles.indexOf(user.role) !== -1);
          }
          else if(angular.isString(roles)) {
            allowed = (roles === user.role);
          }

          return allowed;
        }
        else if(angular.isFunction(item.showIf)) { // custom function
          return item.showIf();
        }

        return true;
      };

      var
      item = scope.$eval(attrs.navbarItem);

      if(!!item) {
        element.html(tplItem(item));
        $compile(element.contents())(scope);
      }
    }
  };
});