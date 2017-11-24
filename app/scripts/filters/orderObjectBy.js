'use strict';

angular
  .module('ecampusApp')
  .filter('orderObjectBy', function() {
    return function(items, field, reverse) {
      var filtered = [];

      angular.forEach(items, function(item) {
        filtered.push(item);
      });

      filtered.sort(function(a, b) {
        switch (field) {
          case 'blockName':
            return a.blockName.localeCompare(b.blockName);
          case 'nameUkr':
            return a.nameUkr.localeCompare(b.nameUkr);
          case 'okr':
            return a.okr.localeCompare(b.okr);
          case 'disciplineName':
            return a.disciplineName.localeCompare(b.disciplineName);
          case 'lecturer':
            return a.lecturer.localeCompare(b.lecturer);
          case 'attestation':
            return a.attestation.localeCompare(b.attestation);
        }
      });

      if (reverse) {
        filtered.reverse();
      }
      return filtered;
    };
  });
