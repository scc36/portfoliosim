'use strict';

/* Services */

angular.module('StockPortfolioSimulator.services', [])
  // Return application version
  .value('version', '0.1')
  .constant('SERVERLOCATION', '')
  .service('User', [function (_) {
    return {
      // Holds all the user information
      'settings': {},		// User settings
      'portfolios': {
        "One": {
          "id": "One",
          "stocks": {
            "ABC": {"price": 1134},
            "XYZ": {"price": 9},
            "HHH": {"price": 55}
          }
        }
      }		// Profiles belonging to the user
    };
  }])
  .factory('ServerRequests', ['$http', '$q', 'SERVERLOCATION', function($http, $q, SERVERLOCATION) {
    return {
      getData: function() {
        // get list of clients available to user
        //return $http.get(SERVERLOCATION + 'client_list')
        //  .then(this.response, this.error);
        return "Stuff";
      },
      
      // Common elements
      
      // Common reponse processing
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
