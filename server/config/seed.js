/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var
Q = require('q'),
moment = require('moment'),
User = require('../api/user/user.model'),
Group = require('../api/group/group.model'),
Service = require('../api/service/service.model');

//
// Un-associated entries
//

function seedUsers() {
  var defer = Q.defer();

  console.log('search & destroy existing users..');

  User
    .find({})
    .remove(function(err) {
      if(err) {
        return defer.reject(err);
      }

      console.log('seeding test users..');

      User.create({
        provider: 'local',
        name: 'Test User',
        email: 'test@test.com',
        password: 'test'
      }, {
        provider: 'local',
        role: 'admin',
        name: 'Admin',
        email: 'admin@admin.com',
        password: 'admin'
      }, function(err, user1, user2) {
          if(err) {
            return defer.reject(err);
          }

          var users = [user1, user2];

          console.log('finished seeding %d test users', users.length);

          defer.resolve(users);
        }
      );
    });

  return defer.promise;
}

function seedGroups() {
  var
  defer = Q.defer();

  var
  billingMethodMock = [
    {
      method: Group.BILLING_METHOD_CC,
      detail: {
        name: 'XX YY ZZ',
        cardType: 'mastercard',
        cardNumber: '12345-12345-12345-12345',
        cardExpire: '2014-12',
        cardCV: '123'
      }
    },
    {
      method: Group.BILLING_METHOD_PAYPAL,
      detail: {
        name: 'XX YY ZZ',
        ppAggreementId: '12345-12345-12345-12345',
        ppHolderEmail: 'xxx@yyy.com'
      }
    }
  ],
  dateToday = moment(),
  dateBeginMonth = moment(dateToday).startOf('month').utc().toString(),
  dateLastMonth = moment(dateBeginMonth).subtract(1, 'month').utc().toString();

  console.log('search & destroy existing groups..');

  Group
    .find({})
    .remove(function(err) {
      if(err) {
        return defer.reject(err);
      }

      console.log('seeding test groups..');

      Group.create({
        name: 'Gold Group',
        description: 'Gold test group',
        primaryDomain: 'http://hookupjs.org/',
        servicePlan: Group.SVCPLAN_GOLD,
        billingSchedule: Group.BILLING_YEARLY,
        billingMethod: billingMethodMock[0],
        billingHistory: [{ // fake billing history
          method: billingMethodMock[0],
          date: dateBeginMonth,
          amount: 1000
        }, {
          method: billingMethodMock[0],
          date: dateLastMonth,
          amount: 1000
        }],
      }, {
        name: 'Silver Group',
        description: 'Silver test group',
        primaryDomain: 'http://hookupjs.org/',
        servicePlan: Group.SVCPLAN_SILVER,
        billingSchedule: Group.BILLING_MONTHLY,
        billingMethod: billingMethodMock[1],
        billingHistory: [{ // fake billing history
          method: billingMethodMock[1],
          date: dateBeginMonth,
          amount: 250
        }, {
          method: billingMethodMock[1],
          date: dateLastMonth,
          amount: 250
        }],
      }, {
        name: 'Bronze Group',
        description: 'Bronze test group',
        primaryDomain: 'http://hookupjs.org/',
        servicePlan: Group.SVCPLAN_BRONZE
      }, function (err, goldGroup, silverGroup, bronzeGroup) {
          if(err) {
            return defer.reject(err);
          }

          var groups = [goldGroup, silverGroup, bronzeGroup];

          console.log('finished seeding %d test groups', groups.length);

          defer.resolve(groups);
        }
      );
    });

  return defer.promise;
}

function seedServices() {
  var
  defer = Q.defer(),
  tag_social = 'Social',
  tag_search = 'Search';

  console.log('search & destroy existing services..');

  Service
    .find({})
    .remove(function(err) {
      if(err) {
        return defer.reject(err);
      }

      console.log('seeding test services..');

      Service.create({
        name: 'Facebook Users',
        description: 'Service for facebook user analytics',
        free: true,
        tags: [tag_social],
        adapter: {
          factoryClass: 'facebook-user',
          defaultParams: {
          }
        }
      }, {
        name: 'Facebook Pages',
        description: 'Service for facebook page analytics',
        free: true,
        tags: [tag_social],
        adapter: {
          factoryClass: 'facebook-page',
          defaultParams: {
          }
        }
      }, {
        name: 'Google Plus',
        description: 'Service for Google+ profile analytics and social engagement',
        free: true,
        tags: [tag_social],
        adapter: {
          factoryClass: 'google-plus',
          defaultParams: {
          }
        }
      }, {
        name: 'Twitter',
        description: 'Service for Twitter profile analytics and social engagement',
        free: true,
        tags: [tag_social],
        adapter: {
          factoryClass: 'twitter',
          defaultParams: {
          }
        }
      }, {
        name: 'Google Search',
        description: 'Service for Google search analytics and rank monitoring',
        free: false,
        tags: [tag_search],
        adapter: {
          factoryClass: 'google-cse',
          defaultParams: {
          }
        }
      }, {
        name: 'Bing Search',
        description: 'Service for Bing search analytics and rank monitoring',
        free: false,
        tags: [tag_search],
        adapter: {
          factoryClass: 'bing-search',
          defaultParams: {
          }
        }
      }, function (err, fbUsers, fbPages, googlePlus, twitter, googleSearch, bingSearch) {
          if(err) {
            return defer.reject(err);
          }

          var services = [fbUsers, fbPages, googlePlus, twitter, googleSearch, bingSearch];

          console.log('finished seeding %d test services', services.length);

          defer.resolve(services);
        }
      );
    });

  return defer.promise;
}


//
// Complex associations
//

function seedGroupsServices(groups, services) {
  var

  // groups order from promise
  groupGold   = groups[0],
  groupSilver = groups[1],
  groupBronze = groups[2],

  // services order from promise
  svcFbUsers      = services[0],
  svcFbPages      = services[1],
  svcGooglePlus   = services[2],
  svcTwitter      = services[3],
  svcGoogleSearch = services[4],
  svcBingSearch   = services[5];

  [ // our test data fixtures

    [groupBronze, svcFbUsers,      {}],
    [groupBronze, svcFbPages,      {}],
    [groupBronze, svcGooglePlus,   {}],
    [groupBronze, svcTwitter,      {}],
    [groupBronze, svcGoogleSearch, {}],
    [groupBronze, svcBingSearch,   {}],

    [groupSilver, svcFbUsers, {
      userId: 'xx-yy-zz',
      oAuthToken: 'xx-yy-zz-11-22-33'
    }],
    [groupSilver, svcFbPages, {
      pageId: 'xx-yy-zz',
      oAuthToken: 'xx-yy-zz-11-22-33'
    }],
    [groupSilver, svcGooglePlus, {
      profileId: 'xx-yy-zz',
      oAuthToken: 'xx-yy-zz-11-22-33'
    }],
    [groupSilver, svcTwitter, {
      profileId: 'xx-yy-zz',
      oAuthToken: 'xx-yy-zz-11-22-33'
    }],
    [groupSilver, svcGoogleSearch, {
      keywords: ['test', 'keyword', 'list', 'can', 'go', 'here'],
      apiKey: 'something',
      apiSecret: 'else'
    }],
    [groupSilver, svcBingSearch, {
      keywords: ['test', 'keyword', 'list', 'can', 'go', 'here'],
      apiKey: 'something',
      apiSecret: 'else'
    }],

    [groupGold,   svcFbUsers,      {}],
    [groupGold,   svcFbPages,      {}],
    [groupGold,   svcGooglePlus,   {}],
    [groupGold,   svcTwitter,      {}],
    [groupGold,   svcGoogleSearch, {}],
    [groupGold,   svcBingSearch,   {}]
  ].forEach(function (a) {
    var
    group   = a[0],
    service = a[1],
    config  = a[2];

    console.log('configuring group "%s" with service "%s" (%j)', group.name, service.name, config);

    group.configureService(service, config);
  });

  console.log('saving state of groups after modifying service configurations');

  return Q.allSettled([ // save all 3 groups
    Q.nbind(groupGold.save, groupGold)(),
    Q.nbind(groupSilver.save, groupSilver)(),
    Q.nbind(groupBronze.save, groupBronze)()
  ]);
}

function seedUsersGroups(users, groups) {
  var

  // users order from promise
  userTest  = users[0],
  userAdmin = users[1],

  // groups order from promise
  groupGold   = groups[0],
  groupSilver = groups[1],
  groupBronze = groups[2];

  [ // our test data fixtures
    [userTest,  groupBronze, Group.RELATION_OWNER],
    [userTest,  groupSilver, Group.RELATION_EDITOR],
    [userTest,  groupGold,   Group.RELATION_VIEWER],
    [userAdmin, groupSilver, Group.RELATION_EDITOR],
    [userAdmin, groupGold,   Group.RELATION_OWNER]
  ].forEach(function (a) {
    var
    user     = a[0],
    group    = a[1],
    relation = a[2];

    console.log('registering user "%s" to group "%s" (as %s)', user.name, group.name, relation);

    group.registerUser(user, relation);
  });

  console.log('saving state of groups after modifying memberships');

  return Q.allSettled([ // save all 3 groups
    Q.nbind(groupGold.save, groupGold)(),
    Q.nbind(groupSilver.save, groupSilver)(),
    Q.nbind(groupBronze.save, groupBronze)()
  ]);
}

Q.allSettled([ // create primitives
  seedUsers(),
  seedGroups(),
  seedServices()
])
.then(function (results) { // create complex associations

  var
  testUsers = results[0].value,
  testGroups = results[1].value,
  testServices = results[2].value;

  return Q.allSettled([
    seedGroupsServices(testGroups, testServices),
    seedUsersGroups(testUsers, testGroups)
  ]);
})
.then(function () {
  console.log('All data seeded successfully');
})
.catch(function (err){
  console.error(err.stack || err);
}).done();