'use strict';

angular.module('auditpagesApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('app.dashboard', {
        url: '/dashboard',
        data: {
          breadcrumbTitle: 'My Dashboard',
          roles: ['user']
        },
        views: {
          'content': {
            templateUrl: 'app/dashboard/dashboard.html',
            controller: 'DashboardCtrl'
          }
        }
      })
      .state('app.dashboard.create-post', {
        url: '/create-post/:date/:periodStart/:periodEnd',
        data: {
          breadcrumbTitle: 'Create Post',
          roles: ['user']
        },
        views: {
          'dashboardView': {
            templateUrl: 'app/dashboard/create-post/create-post.html',
            controller: 'DashboardCreatePostCtrl'
          }
        }
      })
      .state('app.dashboard.view-posts', {
        url: '/view-posts/:date/:periodStart/:periodEnd',
        data: {
          breadcrumbTitle: 'View Posts',
          roles: ['user']
        },
        views: {
          'dashboardView': {
            templateUrl: 'app/dashboard/view-posts/view-posts.html',
            controller: 'DashboardViewPostsCtrl'
          }
        }
      });
  });
