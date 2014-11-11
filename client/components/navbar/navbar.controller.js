'use strict';

angular.module('auditpagesApp')
  .controller('NavbarCtrl', function ($scope, $location, Auth) {
      $scope.isLoggedIn = Auth.isLoggedIn;
      if(!$scope.isLoggedIn){
    $scope.menu = [{
      'title': 'Home',
      'link': '/',
    }];
      }
      else{
           $scope.menu = [{
      'title': 'Home',
      'link': '/',
    },
    {
      'title': 'Keywords',
      'state': 'app.keyword',
    }];
          
      }
    $scope.isCollapsed = true;
    $scope.isLoggedIn = Auth.isLoggedIn;
    $scope.isAdmin = Auth.isAdmin;
    $scope.getCurrentUser = Auth.getCurrentUser;

    $scope.logout = function() {
      Auth.logout();
      $location.path('/login');
    };

    $scope.isActive = function(route) {
      return route === $location.path();
    };
  });