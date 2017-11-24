'use strict';

angular
  .module('ecampusApp')
  .filter('orderObjectBy', function() {
    return function(items, field, reverse) {
      var filtered = [];

      angular.forEach(items, function(item) {
        filtered.push(item);
      });

      function sortRule(a, b) {
        var field1 = a[field];
        var field2 = b[field];
        return field1.localeCompare(field2);
      }

      if (field) {
        filtered.sort(sortRule);
      }

      if (reverse) {
        filtered.reverse();
      }

      return filtered;
    };
  });
