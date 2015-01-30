'use strict';

// Declare app level module which depends on filters, and services
angular.module('StockPortfolioSimulator', [
  'ngRoute',
  'StockPortfolioSimulator.filters',
  'StockPortfolioSimulator.services',
  'StockPortfolioSimulator.directives',
  'StockPortfolioSimulator.controllers',
  'firebase',
  'ui.bootstrap'
])
.config(['$routeProvider', function($routeProvider) {
  $routeProvider.
    when('/login', {
      templateUrl: 'partials/login.html',
      controller: 'LoginCtrl'
    }).
    
    when('/dashboard', {
      templateUrl: 'partials/dashboard.html',
      controller: 'DashCtrl'
    }).
    
    when('/portfolio/:portfolioId', {
      templateUrl: 'partials/portfolio-view.html',
      controller: 'PortfolioViewCtrl'
    }).
    when('/new', {
      templateUrl: 'partials/portfolio-new.html',
      controller: 'PortfolioNewCtrl',
      createMode: 'new'
    }).
    when('/clone', {
      templateUrl: 'partials/portfolio-new.html',
      controller: 'PortfolioNewCtrl',
      createMode: 'clone'
    }).
    
    when('/404', {
      templateUrl: 'partials/404.html'
    }).
    otherwise({
      redirectTo: '/login'
    });
  
}]);