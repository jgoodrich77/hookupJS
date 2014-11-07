'use strict';

angular
.module('auditpagesApp')
.directive('navbarItem', function ($q, $compile, Auth) {

  function linkItemTemplate(item) {

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

    if(item.roles) {
      tpl += ' ng-show="roleTest(item.roles)"'
    }
    else if(angular.isFunction(item.showIf)) {
      tpl += ' ng-show="{{item.showIf}}"'
    }

    return tpl + '>'+icon+caption+'</a>';
  }

  return {
    restrict: 'A',
    scope: {
      item: '=navbarItem'
    },
    link: function(scope, iElement, iAttrs) {

      scope.roleTest = function(roles) {
        if(!roles) {
          return true;
        }
        else if(!Auth.isLoggedIn()) {
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
      };

      scope.$watch(iAttrs.navbarItem, function (nV) {
        if(!nV) return;

        iElement.html(linkItemTemplate(nV)).show();

        $compile(iElement.contents())(scope);
      });
    }
  };
});