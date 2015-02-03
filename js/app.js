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
.run(["$rootScope", "$location", function($rootScope, $location) {
  $rootScope.$on("$routeChangeError", function(event, next, previous, error) {
    // Firebase authentication redirect for private pages
    // We can catch the error thrown when the $requireAuth promise is rejected
    // and redirect the user back to the home page
    if (error === "AUTH_REQUIRED") {
      $location.path("/login");
    }
  });
}])
.config(['$routeProvider', function($routeProvider) {
  $routeProvider.
    when('/login', {
      templateUrl: 'partials/login.html',
      controller: 'LoginCtrl',
      resolve: {
        // controller will not be loaded until $waitForAuth resolves
        // Uses User
        "currentAuth": ["Auth", function(Auth) {
          // $waitForAuth returns a promise so the resolve waits for it to complete
          return Auth.$waitForAuth();
        }]
      }
    }).
    
    when('/dashboard', {
      templateUrl: 'partials/dashboard.html',
      controller: 'DashCtrl',
      resolve: {
        // controller will not be loaded until $requireAuth resolves
        "currentAuth": ["Auth", function(Auth) {
          // $requireAuth returns a promise so the resolve waits for it to complete
          // If the promise is rejected, it will throw a $stateChangeError (see above)
          return Auth.$requireAuth();
        }]
      }
    }).
    
    when('/portfolio/:portfolioId', {
      templateUrl: 'partials/portfolio-view.html',
      controller: 'PortfolioViewCtrl',
      resolve: {
        // controller will not be loaded until $waitForAuth resolves
        // Auth refers to our $firebaseAuth wrapper in the example above
        "currentAuth": ["Auth", function(Auth) {
          // $waitForAuth returns a promise so the resolve waits for it to complete
          return Auth.$waitForAuth();
        }]
      }
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