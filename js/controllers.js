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
  .controller('LoginCtrl', ['$scope', '$location', '$firebase', 'User',
    function ($scope, $location, $firebase, User) {
      
    }
  ])
  
  /***** PORTFOLIO VIEW *****/
  .controller('PortfolioViewCtrl', ['$scope', '$location', '$routeParams', '$firebase', '_', 'User',
    function ($scope, $location, $routeParams, $firebase, _, User) {
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
  .controller('DashCtrl', ['$scope', '$location', '$q', '$firebase', '_', 'currentAuth', 'User', 'FinancialRequests',
    function ($scope, $location, $q, $firebase, _, currentAuth, User, FinancialRequests) {
      $scope.settings = User.settings;
      $scope.count = 0;
      $scope.bestPortfolio = "";
      $scope.worstPortfolio = "";
      
      // Initialize Firebase
      var ref = new Firebase("https://portfoliosim.firebaseio.com/portfolios/");
      // create an AngularFire reference to the data
      var sync = $firebase(ref.orderByChild("owner").equalTo(User.settings.name));
      var syncObject = sync.$asObject();
      
      // bind firebase to scope.data
      syncObject.$bindTo($scope, "portfolioList");
      
      // on data load
      syncObject.$loaded().then(function() {
        $scope.portfolioList;
        _.each($scope.portfolioList, function(portfolio) {
          // Only look over actual portfolio objects
          if (portfolio && typeof portfolio === 'object') {
            // Get current prices if endDate is empty:
            if (!portfolio.endDate) {
              portfolio.endValue = 0;
              var querySymbols = "";
              portfolio.stocks.forEach(function(stock) {
                querySymbols += stock.symbol + ",";
              });
              querySymbols = querySymbols.slice(0, -1);
              
              FinancialRequests.getStockInfo(querySymbols).then(function(stocks) {
                //console.log(data);
                stocks.forEach(function(stock, index) {
                  portfolio.endValue += stock.l * portfolio.stocks[index].shares;
                });
              }, function(error) {
                // Add error message
              });
            }
          }
        });
        
        // Find the portfolios with the Highest and Lowest value differences
        RankPortfolios();
      });
      
      function RankPortfolios() {
        var bestDiff;
        var worstDiff;
        _.each($scope.portfolioList, function(portfolio) {
          
        });
      }
    }
  ])
  
  /***** NEW PORTFOLIO *****/
  .controller('PortfolioNewCtrl', ['$scope', '$route', '$http', '$location', '$firebase', 'User', 'FinancialRequests',
    function ($scope, $route, $http, $location, $firebase, User, FinancialRequests) {
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
        $scope.newPortfolio.name = "";
        $scope.newPortfolio.startDate = new Date();
        $scope.newPortfolio.endDate = "";
        $scope.newPortfolio.stocks = [];
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
        FinancialRequests.getHistoricStockInfo($scope.newStock.name, stringStartDate)
          .then(function(data) {
            var price = "N/A";
            price = 1;
            if (data.query.results) {
              var stockInfo = data.query.results.quote;
              price = stockInfo.Close;
            }
            $scope.newPortfolio.stocks.push ({
              "symbol": $scope.newStock.name,
              "shares": $scope.newStock.shares,
              // Potentially remove below, can calculate/retrieve on fly
              "price": price,
              "value": Number($scope.newStock.shares) * Number(price),
            });
            $scope.newStock = {};
          }, function(error) {
            // Add error message
          });
      };
      
      $scope.removeStock = function (index) {
        //delete $scope.newPortfolio.stocks [name];
        $scope.newPortfolio.stocks.splice(index, 1);
      };
      
      $scope.savePortfolio = function (name) {
        $scope.newPortfolio.startValue = 0;
        $scope.newPortfolio.stocks.forEach(function(stock) {
          $scope.newPortfolio.startValue += stock.value;
        });
        console.log($scope.newPortfolio);
        $scope.newPortfolio.startTime = $scope.newPortfolio.startDate.getTime();
        if ($scope.newPortfolio.endDate) {
          $scope.newPortfolio.endTime = $scope.newPortfolio.endDate.getTime();
        }
        $scope.portfolios[ref.push().key()] = $scope.newPortfolio;
        $location.path("/dashboard");
      };
    }
  ])
  
  /***** 404 ERROR *****/
  .controller('FourOFourCtrl', ['$scope', '$http',
    function ($scope, $http) {
      
    }
  ])
;
