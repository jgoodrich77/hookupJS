'use strict';

angular
.module('auditpagesApp')
.service('$paginationOpts', function () {
  return {
    perPage: 5,
    pageSizes: [5, 10, 25]
  };
})
.service('$creditCard', function() {
  return {
    listYears: function() {
      var
      years = [],
      amount = 15,
      year = parseInt((new Date()).getFullYear()) + 1,
      yearEnd = year + amount;

      for(; year <= yearEnd; year++) {
        years.push(year);
      }

      return years;
    },

    listMonths: function() {
      var
      months = [],
      month = 1;

      for(; month <= 12; month++) {
        months.push((month < 10) ? '0' + month : String(month));
      }

      return months;
    }
  };
});