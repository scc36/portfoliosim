'use strict';

// Declare app level module which depends on filters, and services
angular.module('StockPortfolioSimulator', [
  'ngRoute',
  'StockPortfolioSimulator.filters',
  'StockPortfolioSimulator.services',
  'StockPortfolioSimulator.directives',
  'StockPortfolioSimulator.controllers'
])
.config(['$routeProvider', function($routeProvider) {
  $routeProvider.
    when('/dashboard', {
      templateUrl: 'partials/dashboard.html',
      controller: 'DashCtrl'
    }).
    
    when('/profile/:profileId', {
      templateUrl: 'partials/profile-view.html',
      controller: 'ProfileViewCtrl'
    }).
    when('/new', {
      templateUrl: 'partials/profile-new.html',
      controller: 'ProfileNewCtrl'
    }).
    
    when('/404', {
      templateUrl: 'partials/404.html'
    }).
    otherwise({
      redirectTo: '/dashboard'
    });
  
}]);