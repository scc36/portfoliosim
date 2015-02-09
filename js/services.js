'use strict';

/* Services */

angular.module('StockPortfolioSimulator.services', [])
  // Return application version
  .value('version', '0.1')
  .service('User', [function () {
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
      getHistoricStockInfo: function(symbol, date) {
        var url = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.historicaldata%20where%20symbol%20in%20(%22"
          + symbol + "%22)%20and%20startDate%20%3D%20%22" + date +
          "%22%20and%20endDate%20%3D%20%22" + date +
          "%22&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys";
        url = "http://www.google.com/finance/historical?q=" +
          symbol + "&histperiod=daily&startdate=" + date +
          "&enddate=" + date + "&output=csv";
        return $http.get(url)
          .then(this.csvResponse, this.error);
      },
      getStockInfo: function(symbol) {
        // can have multiple symbols, comma separated
        //http://finance.google.com/finance/info?client=ig&q=GOOG
        var url = "https://finance.google.com/finance/info?client=ig&q="
          + symbol + "&callback=JSON_CALLBACK";
        //console.log(url);
        return $http.jsonp(url)
          .then(this.response, this.error);
      },
      
      /* Gets a single stock price, given the symbol and date
       *  If the date is today, later, or null: get current price
       *  Otherwise, get a month's range (in case the date given does not
       *    occur during a market day)
       *  getStockPrice(string, date)->{}
       */
      getStockPrice: function(symbol, date) {
        // Use Google Finance for current stock price (12 hour buffer)
        if(!date || date.getTime() >= new Date().getTime() - (12 * 60 * 60 * 1000)) {
          console.log("Retrieving " + symbol + " from Google Finance");
          var url = "https://finance.google.com/finance/info?client=ig&q="
              + symbol + "&callback=JSON_CALLBACK";
          
          // Using jsonp due to cross domain
          return $http.jsonp(url)
            .then(this.googleStockReponse, this.error);
        }
        // Use Quandl for historical price
        else {
          console.log("Retrieving " + symbol + " from Quandl");
          
          // finding a range in case the given date falls on a vacation day
          var bufferDate = new Date(date.getTime());
          bufferDate.setMonth(bufferDate.getMonth() - 1);
          
          // My Quandl auth token is: -k1CMsFnXR5zsBKbS9ix
          var url = "https://www.quandl.com/api/v1/datasets/WIKI/" +
            symbol + ".json?column=4&sort_order=desc&trim_start=" + this.dateToSimpleString(bufferDate) +
            "&trim_end=" + this.dateToSimpleString(date) + "&auth_token=-k1CMsFnXR5zsBKbS9ix";
          
          return $http.get(url)
            .then(this.quandlStockReponse, this.error);
        }
      },
      
      // *** Helper functions
      
      // Converts a date object to a string (yyyy-mm-dd)
      dateToSimpleString: function(date) {
        var stringDate = date.getFullYear() + "-" +
                         (date.getMonth() + 1) + "-" +
                         date.getDate();
        return stringDate;
      },
      
      // *** Common response processing
      
      // interpret google stock response, returns a price object
      googleStockReponse: function(response) {
        if (typeof response.data === 'object') {
          return {price: response.data[0].l};
        } else {
          // invalid response
          return $q.reject(response.data);
        }
      },
      
      // interpret quandl stock response, returns a price object
      quandlStockReponse: function(response) {
        if (typeof response.data === 'object') {
          var arrayData = response.data.data;
          console.log(arrayData[0]);
          return {price: arrayData[0][1]};
        } else {
          // invalid response
          return $q.reject(response.data);
        }
      },
      
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
  // Allowing underscore.js operations
  .factory("_", [function() {
		return window._; // assumes underscore has already been loaded on the page
	}])
;
