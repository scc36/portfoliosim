'use strict';

/* Controllers */

angular.module('StockPortfolioSimulator.controllers', [])
  /***** HEADER *****/
  .controller('HeaderCtrl', ['$scope', '$location', '$firebaseAuth', 'Auth', 'User',
    function ($scope, $location, $firebaseAuth, Auth, User) {
      // Initialize Firebase
      var ref = new Firebase("https://portfoliosim.firebaseio.com/");
      $scope.auth = $firebaseAuth(ref);
      
      // Extra Authentication Logic
      Auth.$onAuth(function(authData) {
        $scope.authData = authData;
        if (authData) {
          User.settings = authData.facebook.cachedUserProfile;
          console.log("Signed in as " + User.settings.name);
          if ($location.path().substring(0,10) != "/portfolio") {
            $location.path("/dashboard");
          }
          else {
            $location.path($location.path());
          }
        }
        else {
          console.log("Signed out");
          if ($location.path().substring(0,10) != "/portfolio") {
            $location.path("/");
          }
          else {
            $location.path($location.path());
          }
        }
      });
    }
  ])
  
  /***** LOGIN *****/
  .controller('LoginCtrl', ['$scope', '$location', '$firebaseAuth', 'Auth', 'User',
    function ($scope, $location, $firebaseAuth, Auth, User) {

    }
  ])
  
  /***** PORTFOLIO VIEW *****/
  .controller('PortfolioViewCtrl', ['$scope', '$location', '$routeParams', '$firebase', '$firebaseAuth', 'Auth', 'User',
    function ($scope, $location, $routeParams, $firebase, $firebaseAuth, Auth, User) {
      // Gather data from service
      $scope.portfolioName = $routeParams.portfolioId;
      $scope.portfolio = {};
      $scope.portfolio.stocks = {};
      
      // Initialize Firebase
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
  
  /************* END PUBLIC PAGES *************/
  
  /***** DASHBOARD *****/
  .controller('DashCtrl', ['$scope', '$location', '$firebase', '$firebaseAuth', 'currentAuth', 'Auth', 'User',
    function ($scope, $location, $firebase, $firebaseAuth, currentAuth, Auth, User) {
      // Initialize Firebase
      var ref = new Firebase("https://portfoliosim.firebaseio.com/portfolios/");
      // create an AngularFire reference to the data
      var sync = $firebase(ref);
      var syncObject = sync.$asObject();
      
      // bind firebase to scope.data
      syncObject.$bindTo($scope, "portfolioList");
    }
  ])
  
  /***** NEW PORTFOLIO *****/
  .controller('PortfolioNewCtrl', ['$scope', '$route', '$http', '$location', '$firebase', '$firebaseAuth', 'Auth', 'User', 'FinancialRequests',
    function ($scope, $route, $http, $location, $firebase, $firebaseAuth, Auth, User, FinancialRequests) {
      $scope.settings = User.settings;
      $scope.createMode = "new"
      $scope.createMode = $route.current.createMode
      
      // Initialize Firebase
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
