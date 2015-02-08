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
        // Convert time to date
        $scope.portfolio.startDate = new Date($scope.portfolio.startTime);
        $scope.portfolio.startDateString = ($scope.portfolio.startDate.getMonth() + 1) + "/" +
          $scope.portfolio.startDate.getDate() + "/" +
          $scope.portfolio.startDate.getFullYear();
        if ($scope.portfolio.endTime) {
          $scope.portfolio.endDate = new Date($scope.portfolio.endTime);
          $scope.portfolio.endDateString = ($scope.portfolio.endDate.getMonth() + 1) + "/" +
          $scope.portfolio.endDate.getDate() + "/" +
          $scope.portfolio.endDate.getFullYear();
        }
        else {
          $scope.portfolio.endDate = "";
          calculatePortfolioValues();
        }
      });
      
      $scope.clonePortfolio = function() {
        User.newPortfolio = $scope.portfolio;
        $location.path("/clone");
      }
      
      function calculatePortfolioValues() {
        $scope.portfolio.startValue = 0;
        $scope.portfolio.endValue = 0;
        $scope.portfolio.stocks.forEach(function(stock) {
          $scope.portfolio.startValue += Number(stock.startValue);
          $scope.portfolio.endValue += Number(stock.endValue);
        });
      }
    }
  ])
  
  /************* END PUBLIC PAGES *************/
  
  /***** DASHBOARD *****/
  .controller('DashCtrl', ['$scope', '$location', '$q', '$firebase', '_', 'currentAuth', 'User', 'FinancialRequests',
    function ($scope, $location, $q, $firebase, _, currentAuth, User, FinancialRequests) {
      $scope.settings = User.settings;
      $scope.count = 0;
      
      $scope.bestPortfolio = {};
      $scope.bestPortfolio.name = "";
      $scope.bestPortfolio.increase = 0.0;
      $scope.worstPortfolio = {};
      $scope.worstPortfolio.name = "";
      $scope.worstPortfolio.increase = 0.0;
      
      // Initialize Firebase
      var ref = new Firebase("https://portfoliosim.firebaseio.com/portfolios/");
      // create an AngularFire reference to the data
      var sync = $firebase(ref.orderByChild("owner").equalTo(User.settings.name));
      var syncObject = sync.$asObject();
      
      // bind firebase to scope.data
      syncObject.$bindTo($scope, "portfolioList");
      
      // on data load
      syncObject.$loaded().then(function() {
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
                RankPortfolios();
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
        $scope.bestPortfolio.name = "";
        $scope.bestPortfolio.increase = 0.0;
        $scope.worstPortfolio.name = "";
        $scope.worstPortfolio.increase = 0.0;
        _.each($scope.portfolioList, function(portfolio) {
          if (portfolio && typeof portfolio === 'object') {
            var increase = 100 * Number(portfolio.endValue - portfolio.startValue) / portfolio.startValue;
            if (!$scope.bestPortfolio.name) {
              $scope.bestPortfolio.name = portfolio.name;
              $scope.bestPortfolio.increase = increase;
              $scope.worstPortfolio.name = portfolio.name;
              $scope.worstPortfolio.increase = increase;
            }
            else {
              if (increase > $scope.bestPortfolio.increase) {
                $scope.bestPortfolio.name = portfolio.name;
                $scope.bestPortfolio.increase = increase;
              }
              if (increase < $scope.worstPortfolio.increase) {
                $scope.worstPortfolio.name = portfolio.name;
                $scope.worstPortfolio.increase = increase;
              }
            }
          }
        });
      }
    }
  ])
  
  /***** NEW PORTFOLIO *****/
  .controller('PortfolioNewCtrl', ['$scope', '$route', '$http', '$location', '$firebase', '_', 'User', 'FinancialRequests',
    function ($scope, $route, $http, $location, $firebase, _, User, FinancialRequests) {
      $scope.settings = User.settings;
      $scope.createMode = "new"
      $scope.createMode = $route.current.createMode
      
      $scope.newPortfolio = {};
      $scope.newStock = {};
      
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
        $scope.newPortfolio.name = "My Portfolio";
        $scope.newPortfolio.startDate = new Date();
        $scope.newPortfolio.endDate = "";
        $scope.newPortfolio.startValue = 0;
        $scope.newPortfolio.endValue = 0;
        $scope.newPortfolio.stocks = [];
        $scope.newPortfolio.owner = $scope.settings.name;
      }

      $scope.mapped = [];
      
      $scope.updateNewStock = function() {
        calculateStockValuesOne($scope.newStock);
      }
      
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
      
      $scope.selectStock = function (item) {
        getStockPricesNew();
      }
      
      $scope.addStock = function () {
        $scope.newPortfolio.stocks.push($scope.newStock);
        $scope.newStock = {};
        calculatePortfolioValues();
      };
      
      $scope.removeStock = function (index) {
        //delete $scope.newPortfolio.stocks [name];
        $scope.newPortfolio.stocks.splice(index, 1);
      };
      
      $scope.savePortfolio = function (name) {
        $scope.newPortfolio.startTime = $scope.newPortfolio.startDate.getTime();
        if ($scope.newPortfolio.endDate) {
          $scope.newPortfolio.endTime = $scope.newPortfolio.endDate.getTime();
        }
        $scope.portfolios[ref.push().key()] = $scope.newPortfolio;
        $location.path("/dashboard");
      };
      
      function getStockPricesNew () {
        getStockPricesOne($scope.newStock);
      }
      
      function getStockPricesOne (stock) {
        // Starting price
        var stringStartDate = $scope.newPortfolio.startDate.getFullYear() + "-" +
          ($scope.newPortfolio.startDate.getMonth() + 1) + "-" +
          $scope.newPortfolio.startDate.getDate();
        FinancialRequests.getHistoricStockInfo(stock.symbol, stringStartDate)
          .then(function(data) {
            if (data.query.results) {
              var stockInfo = data.query.results.quote;
              stock.startPrice = stockInfo.Close;
            }
            else {
              stock.startPrice = 0;
            }
            calculateStockValuesOne(stock);
          }, function(error) {
            // Add error message
            console.log(error);
          });
          
          // End price is based on whether an end date is provided
        
        if ($scope.newPortfolio.endDate) {
          var stringEndDate = $scope.newPortfolio.endDate.getFullYear() + "-" +
            ($scope.newPortfolio.endDate.getMonth() + 1) + "-" +
            $scope.newPortfolio.endDate.getDate();
          FinancialRequests.getHistoricStockInfo(stock.symbol, stringEndDate)
            .then(function(data) {
              if (data.query.results) {
                var stockInfo = data.query.results.quote;
                stock.endPrice = stockInfo.Close;
              }
              else {
                stock.endPrice = 0;
              }
              calculateStockValuesOne(stock);
            }, function(error) {
              // Add error message
              console.log(error);
            });
        }
        else {
          FinancialRequests.getStockInfo(stock.symbol).then(function(stocks) {
            // Should only be single symbol
            // stocks[0].l needs to be converted to a number
            stock.endPrice = Number(stocks[0].l);
            calculateStockValuesOne(stock);
          }, function(error) {
            // Add error message
            console.log(error);
          });
        }
      }
      
      function getStockPricesAll () {
        console.log("updating");
        _.each($scope.newPortfolio.stocks, function(stock) {
          console.log(stock);
          getStockPricesOne(stock);
        });
      }
      
      function calculateStockValuesOne(stock) {
        // Only calculate if shares and prices have already been calculated
        if (stock.shares && stock.startPrice && stock.endPrice) {
          stock.startValue = parseInt(stock.shares) * Number(stock.startPrice);
          stock.endValue = parseInt(stock.shares) * Number(stock.endPrice);
        }
      }
      
      function calculatePortfolioValues() {
        $scope.newPortfolio.startValue = 0;
        $scope.newPortfolio.endValue = 0;
        $scope.newPortfolio.stocks.forEach(function(stock) {
          $scope.newPortfolio.startValue += Number(stock.startValue);
          $scope.newPortfolio.endValue += Number(stock.endValue);
        });
      }
    }
  ])
  
  /***** 404 ERROR *****/
  .controller('FourOFourCtrl', ['$scope', '$http',
    function ($scope, $http) {
      
    }
  ])
;
