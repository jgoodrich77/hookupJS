'use strict';

angular.module('auditpagesApp')
  .controller('NavbarCtrl', function ($scope, $location, $state, Auth) {

    var
    loggedIn = Auth.isLoggedIn,
    loggedOut = function(){
      return !loggedIn();
    };

    //
    // Menu items with 'link' property instead of 'state'
    // have a bug right now. Trying to find a way to conditionally
    // add the directive 'ui-sref-active' only when item  has a 'state'
    // property set.
    //

    $scope.menuLeft = [{
      'caption': 'Home',
      'title': 'Go back to home page',
      'state': 'app.main',
      'glyph': 'glyphicon glyphicon-home',
      'showIf': function() {
        return $state.current.name !== 'app.main';
      }
    }/*,{
      'caption': 'External Link',
      'title': 'Go back to Google.com',
      'link': 'http://google.com/',
      'external': true
    }*/];

    $scope.menuRight = [{
      'caption': 'Administration',
      'title': 'Administration page',
      'state': 'app.admin',
      'glyph': 'glyphicon glyphicon-star',
      'roles': ['admin']
    }];

    $scope.userMenu = [{
      'caption': 'Dashboard',
      'title': 'Access your amazing dashboard.',
      'state': 'app.dashboard',
      'glyph': 'fa fa-plug'
    },{
      'caption': 'Groups',
      'title': 'Choose which groups you are associated with',
      'state': 'app.account.groups',
      'glyph': 'glyphicon glyphicon-plane'
    },{
      'caption': 'Settings',
      'title': 'Change your user settings',
      'state': 'app.account.settings',
      'glyph': 'glyphicon glyphicon-cog'
    }];

    $scope.isCollapsed = true;
    $scope.isLoggedIn = Auth.isLoggedIn;
    $scope.isSettingUp = Auth.isSettingUp;
    $scope.currentUser = Auth.getCurrentUser;

    $scope.logout = function() {
      Auth.logout();
      $location.path('/login');
    };

    $scope.isActive = function(route) {
      return route === $location.path();
    };
  });
