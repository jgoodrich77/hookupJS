'use strict';

angular.module('auditpagesApp')
.constant('envConfig', {
  version: '@@version',
  facebookAppId: '@@facebookAppId',
  googleAnalyticsId: '@@googleAnalyticsId'
});