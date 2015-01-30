'use strict';

/* Controllers */

angular.module('StockPortfolioSimulator.controllers', [])
  /***** HEADER *****/
  .controller('HeaderCtrl', ['$scope', '$firebaseAuth', 'User',
    function ($scope, $location, $firebaseAuth, User) {
      $scope.header.loggedIn = false;
      
      $scope.faceLogin = function () {
        var ref = new Firebase("https://portfoliosim.firebaseio.com/");
        var auth = $firebaseAuth(ref);
        auth.$authWithOAuthPopup("facebook").then(function(authData) {
          User.settings = authData.facebook.cachedUserProfile;
          $location.path("/dashboard");
          $scope.header.loggedIn = true;
        }).catch(function(error) {
          console.error("Authentication failed: ", error);
        });
      }
    }
  ])
  
  /***** LOGIN *****/
  .controller('LoginCtrl', ['$scope', '$location', '$firebaseAuth', 'User',
    function ($scope, $location, $firebaseAuth, User) {
      $scope.faceLogin = function () {
        var ref = new Firebase("https://portfoliosim.firebaseio.com/");
        var auth = $firebaseAuth(ref);
        auth.$authWithOAuthPopup("facebook").then(function(authData) {
          User.settings = authData.facebook.cachedUserProfile;
          $location.path("/dashboard");
        }).catch(function(error) {
          console.error("Authentication failed: ", error);
        });
      }
    }
  ])
  
  /***** DASHBOARD *****/
  .controller('DashCtrl', ['$scope', '$location', '$firebase', 'User',
    function ($scope, $location, $firebase, User) {
      // Ensure log-in status
      $scope.settings = User.settings
      if (!$scope.settings.id) {
        $location.path("/");
      }
      
      var ref = new Firebase("https://portfoliosim.firebaseio.com/portfolios/");
      // create an AngularFire reference to the data
      var sync = $firebase(ref);
      var syncObject = sync.$asObject();
      
      // bind firebase to scope.data
      syncObject.$bindTo($scope, "portfolioList");
    }
  ])
  
  /***** PORTFOLIO VIEW *****/
  .controller('PortfolioViewCtrl', ['$scope', '$location', '$routeParams', '$firebase', 'User',
    function ($scope, $location, $routeParams, $firebase, User) {
      // Gather data from service
      $scope.portfolioName = $routeParams.portfolioId;
      $scope.portfolio = {};
      $scope.portfolio.stocks = {};
      
      var ref = new Firebase("https://portfoliosim.firebaseio.com/portfolios/" + $scope.portfolioName);
      // create an AngularFire reference to the data
      var sync = $firebase(ref);
      var syncObject = sync.$asObject();
      
      // bind firebase to scope.data
      syncObject.$bindTo($scope, "portfolio");

      // Gather data from service
      syncObject.$loaded().then(function(sync) {
        ;
      });
      
      $scope.clonePortfolio = function() {
        User.newPortfolio = $scope.portfolio;
        $location.path("/clone");
      }
    }
  ])
  
  /***** NEW PORTFOLIO *****/
  .controller('PortfolioNewCtrl', ['$scope', '$route', '$http', '$location', '$firebase', 'User', 'FinancialRequests',
    function ($scope, $route, $http, $location, $firebase, User, FinancialRequests) {
      // Ensure log-in status
      $scope.settings = User.settings
      if (!$scope.settings.id) {
        $location.path("/");
      }
      
      $scope.createMode = "new"
      $scope.createMode = $route.current.createMode
      
      // Gather data from service
      var ref = new Firebase("https://portfoliosim.firebaseio.com/portfolios/");
      // create an AngularFire reference to the data
      var sync = $firebase(ref);
      var syncObject = sync.$asObject();
      
      // bind firebase to scope.data
      syncObject.$bindTo($scope, "portfolios");

      if ($scope.createMode == "clone") {
        $scope.newPortfolio = User.newPortfolio;
        $scope.newPortfolio.owner = $scope.settings.name;
      }
      //createMode == "new"
      else {
        $scope.newPortfolio = {}
        $scope.newPortfolio.id = "";
        $scope.newPortfolio.startDate = new Date();
        $scope.newPortfolio.endDate = "";
        $scope.newPortfolio.stocks = {};
        $scope.newPortfolio.owner = $scope.settings.name;
      }

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
        FinancialRequests.getStockInfo($scope.newStock.name, stringStartDate)
          .then(function(data) {
            var price = "N/A";
            if (data.query.results) {
              var stockInfo = data.query.results.quote;
              price = stockInfo.Close;
            }
            $scope.newPortfolio.stocks [$scope.newStock.name] = {
              "price": price,
              "shares": $scope.newStock.shares,
            };
            $scope.newStock = {};
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
        $location.path("/dashboard");
      }
    }
  ])
  
  /***** 404 ERROR *****/
  .controller('FourOFourCtrl', ['$scope', '$http',
    function ($scope, $http) {
      
    }
  ])
;
