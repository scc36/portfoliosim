'use strict';

/* Controllers */

angular.module('StockPortfolioSimulator.controllers', [])

  /***** DASHBOARD *****/
  .controller('DashCtrl', ['$scope', 'User',
    function ($scope, User) {
      $scope.settings = User.settings;
      // Gather data from service
      $scope.portfolioList = User.portfolios;
    }
  ])
  
  /***** PROFILE LIST *****/
  .controller('PortfolioViewCtrl', ['$scope', '$routeParams', 'User',
    function ($scope, $routeParams, User) {
      // Gather data from service
      $scope.portfolioName = $routeParams.portfolioId;
      // Gather data from service
      $scope.stockList = User.portfolios[$scope.portfolioName].stocks;
    }
  ])
  
  /***** DASHBOARD *****/
  .controller('PortfolioNewCtrl', ['$scope', '$location', 'User',
    function ($scope, $location, User) {
      // Gather data from service
      $scope.portfolios = User.portfolios
      
      $scope.portfolioName = "";
      $scope.stockList = {};
      
      $scope.addStock = function () {
        $scope.stockList [$scope.newStock] = {"price": 100};
        $scope.newStock = "";
      }
      
      $scope.removeStock = function (name) {
        delete $scope.stockList [name];
      }
      
      $scope.savePortfolio = function (name) {
        $scope.portfolios[$scope.portfolioName] = {
          "id": $scope.portfolioName,
          "stocks": $scope.stockList
        };
        $location.path("/");
      }
    }
  ])
  
  /***** 404 ERROR *****/
  .controller('FourOFourCtrl', ['$scope', '$http',
    function ($scope, $http) {
      
    }
  ])
;
