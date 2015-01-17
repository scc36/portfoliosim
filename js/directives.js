'use strict';

/* Directives */


angular.module('StockPortfolioSimulator.directives', []).
  // get app version
  directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }])
;
