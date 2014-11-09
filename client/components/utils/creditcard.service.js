'use strict';

angular
  .module('auditpagesApp')
  .service('$creditCard', function () {
    return {
      listYears: function () {
        var
        years = [],
        amount = 15,
        year = parseInt((new Date()).getFullYear()) + 1,
        yearEnd = year + amount;

        for(; year <= yearEnd; year++) {
          years.push(String(year));
        }

        return years;
      },

      listMonths: function () {
        var
        months = [],
        month = 1;

        for(; month <= 12; month++) {
          months.push(String(month < 10 ? '0' + month : month));
        }

        return months;
      }
    };
  });