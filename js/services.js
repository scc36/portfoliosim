'use strict';

/* Services */

angular.module('StockPortfolioSimulator.services', [])
  // Return application version
  .value('version', '0.1')
  .service('User', [function (_, $firebase, $firebaseAuth) {
    return {
      // Holds all the user information
      'settings': {},		// User settings
      'newPortfolio': {},  // For saving new Portfolio info
    };
  }])
  .factory("Auth", ["$firebaseAuth", function($firebaseAuth) {
    // Only for authentication
    var ref = new Firebase("https://portfoliosim.firebaseio.com/");
    return $firebaseAuth(ref);
  }])
  .factory('FinancialRequests', ['$http', '$q', function($http, $q) {
    return {
      getStockInfo: function(symbol, date) {
        var url = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.historicaldata%20where%20symbol%20in%20(%22"
          + symbol + "%22)%20and%20startDate%20%3D%20%22" + date +
          "%22%20and%20endDate%20%3D%20%22" + date +
          "%22&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys";
        console.log(url);
        return $http.get(url)
          .then(this.response, this.error);
      },
      
      // Common elements
      
      // Common response processing
      response: function(response) {
        if (typeof response.data === 'object') {
          return response.data;
        } else {
          // invalid response
          return $q.reject(response.data);
        }
      },
      
      error: function(response) {
        // something went wrong
        return $q.reject(response.data);
      },
    };
  }])
;
