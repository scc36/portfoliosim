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
      /* Gets a current stock's info, given the symbol
       *  Differs from getStockPrice in that this can handle multiple
       *    stocks at the same time, and it's possible to glean other
       *    stock information as well.
       *  getStockInfo(string)->{}
       */
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
        console.log(response);
        if (typeof response.data === 'object') {
          var arrayData = response.data.data;
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
  
  // Read an RSS news feed
  .factory('FeedService',['$http',function($http){
    return {
      parseFeed : function(url){
        return $http.jsonp('//ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=50&callback=JSON_CALLBACK&q=' + encodeURIComponent(url));
      }
    }
  }])
  // Allowing underscore.js operations
  .factory("_", [function() {
		return window._; // assumes underscore has already been loaded on the page
	}])
;
