'use strict';

angular.module('auditpagesApp')
  .controller('NavbarCtrl', function ($scope, $location, Auth) {

    //
    // Menu items with 'link' property instead of 'state'
    // have a bug right now. Trying to find a way to conditionally
    // add the directive 'ui-sref-active' only when item  has a 'state'
    // property set.
    //

    $scope.menu = [{
      'caption': 'Home',
      'title': 'Go back to home page',
      'state': 'app.main',
      'glyph': 'glyphicon glyphicon-home'
    },{
      'caption': 'Administration',
      'title': 'Administration page',
      'state': 'app.admin',
      'roles': ['admin']
    }/*,{
      'caption': 'External Link',
      'title': 'Go back to Google.com',
      'link': 'http://google.com/',
      'external': true
    }*/];

    $scope.userMenu = [{
      'caption': 'Settings',
      'title': 'Change your user settings',
      'state': 'app.account.settings',
      'glyph': 'glyphicon glyphicon-cog'
    }];

    $scope.isCollapsed = true;
    $scope.isLoggedIn = Auth.isLoggedIn;
    $scope.isAdmin = Auth.isAdmin;
    $scope.currentUser = Auth.getCurrentUser;

    $scope.logout = function() {
      Auth.logout();
      $location.path('/login');
    };

    $scope.isActive = function(route) {
      return route === $location.path();
    };
  });