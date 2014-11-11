'use strict';

angular.module('auditpagesApp')
  .controller('NavbarCtrl', function ($scope, $location, Auth) {
    
          Auth.isLoggedIn({
        })
        .then( function() {
           $scope.menu = [{
      'title': 'Home',
      'link': '/',
    },
    {
      'title': 'Keywords',
      'state': 'app.keyword',
    }];
        })
        .catch( function(err) {
    $scope.menu = [{
      'title': 'Home',
      'link': '/',
    }];
        });
//      if(!$scope.isLoggedIn){
//    $scope.menu = [{
//      'title': 'Home',
//      'link': '/',
//    }];
//      }
//      else{
//           $scope.menu = [{
//      'title': 'Home',
//      'link': '/',
//    },
//    {
//      'title': 'Keywords',
//      'state': 'app.keyword',
//    }];
//          
//      }
      console.log($scope.menu);
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