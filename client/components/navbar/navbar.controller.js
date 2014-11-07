'use strict';

angular.module('auditpagesApp')
  .controller('NavbarCtrl', function ($scope, $location, Auth) {
    $scope.menu = [{
      'caption': 'Home',
      'title': 'Go back to home page',
      'state': 'app.main',
      'glyph': 'glyphicon glyphicon-home'
    },{
      'caption': 'External Link',
      'title': 'Go back to Google.com',
      'link': 'http://google.com/',
      'external': true
    },{
      'caption': 'Role-specific',
      'title': 'Example of a link that will only appear for certain roles',
      'state': 'app.account.settings',
      'roles': ['admin']
    }];

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