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
  .controller('PortfolioNewCtrl', ['$scope', '$http', '$location', 'User', 'FinancialRequests',
    function ($scope, $http, $location, User, FinancialRequests) {
      // Gather data from service
      $scope.portfolios = User.portfolios
      
      $scope.newPortfolio = {}
      $scope.newPortfolio.id = "";
      $scope.newPortfolio.startDate = new Date();
      $scope.newPortfolio.endDate = new Date();
      $scope.newPortfolio.stocks = {};
      $scope.mapped = [];
      
      $scope.getStocks = function(val) {
        /*** symbol lookup based on user input
          http://autoc.finance.yahoo.com/autoc?query=yahoo&callback=YAHOO.Finance.SymbolSuggest.ssCallback
          Should normally have this as a service or factory, but yahoo
          insists on a custom callback function, which angular doesn't support
          so we're tricking the program into thinking there's a YAHOO library
          and calling our own custom callback function.
        */
        var YAHOO = window.YAHOO = {Finance: {SymbolSuggest: {}}};
        YAHOO.Finance.SymbolSuggest.ssCallback = function (data) {
          var mapped = $.map(data.ResultSet.Result, function (e, i) {
            return {
              label: e.symbol + ' (' + e.name + ')',
              value: e.symbol
            };
          });
          $scope.mapped = mapped;
        };
        var url = "http://autoc.finance.yahoo.com/autoc";
        url += "?query=" + val + "&callback=YAHOO.Finance.SymbolSuggest.ssCallback";
        $http.jsonp(url)
          .success(function(data){
            return $scope.mapped;
          }).
          error(function(data) {
            return $scope.mapped;
          });
        // TODO: Will need to delay this until after results
        return $scope.mapped;
      }
      
      $scope.addStock = function () {
        var stringStartDate = $scope.newPortfolio.startDate.getFullYear() + "-" +
          ($scope.newPortfolio.startDate.getMonth() + 1) + "-" +
          $scope.newPortfolio.startDate.getDate();
        FinancialRequests.getStockInfo($scope.newStock, stringStartDate)
          .then(function(data) {
            var price = "N/A";
            if (data.query.results) {
              var stockInfo = data.query.results.quote;
              price = stockInfo.Close;
            }
            $scope.newPortfolio.stocks [$scope.newStock] = {"price": price};
            $scope.newStock = "";
          }, function(error) {
            // Add error message
          });
      }
      
      $scope.removeStock = function (name) {
        delete $scope.newPortfolio.stocks [name];
      }
      
      $scope.savePortfolio = function (name) {
        console.log($scope.newPortfolio);
        $scope.portfolios[$scope.newPortfolio.id] = $scope.newPortfolio;
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
