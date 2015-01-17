'use strict';

/* Controllers */

angular.module('StockPortfolioSimulator.controllers', [])

  /***** DASHBOARD *****/
  .controller('DashCtrl', ['$scope', '$http',
    function ($scope, $http) {
      // Gather data from service
      $scope.profileList = {
        "One": {"id": "One", "price": 1134},
        "Thing": {"id": "Thing", "price": 9},
        "Second": {"id": "Second", "price": 55}
      };
    }
  ])
  
  /***** PROFILE LIST *****/
  .controller('ProfileViewCtrl', ['$scope', '$routeParams', '$http',
    function ($scope, $routeParams, $http) {
      // Gather data from service
      $scope.profileName = $routeParams.profileId;
      $scope.stockList = {
        "ABC": {"price": 1134},
        "XYZ": {"price": 9},
        "HHH": {"price": 55}
      };
    }
  ])
  
  /***** DASHBOARD *****/
  .controller('ProfileNewCtrl', ['$scope', '$http',
    function ($scope, $http) {
      // Gather data from service
      $scope.profileName = "";
      $scope.stockList = {};
      
      $scope.addStock = function () {
        $scope.stockList [$scope.newStock] = {"price": 100};
      }
      
      $scope.removeStock = function (name) {
        delete $scope.stockList [name];
      }
    }
  ])
  
  /***** 404 ERROR *****/
  .controller('FourOFourCtrl', ['$scope', '$http',
    function ($scope, $http) {
      
    }
  ])
;
