'use strict';

describe('Controller: AccountKeywordsCtrl', function () {

  // load the controller's module
  beforeEach(module('auditpagesApp'));
  beforeEach(module('socketMock'));

  var AccountKeywordsCtrl,
      scope,
      $httpBackend;

  // Initialize the controller and a mock scope
  beforeEach(inject(function (_$httpBackend_, $controller, $rootScope) {
    $httpBackend = _$httpBackend_;
    $httpBackend.expectGET('/api/keywords')
      .respond(['HTML5 Boilerplate', 'AngularJS', 'Karma', 'Express']);

    scope = $rootScope.$new();
    AccountKeywordsCtrl = $controller('AccountKeywordsCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of things to the scope', function () {
    $httpBackend.flush();
    expect(scope.awesomeThings.length).toBe(4);
  });
});
