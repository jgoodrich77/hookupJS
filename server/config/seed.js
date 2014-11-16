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
Service = require('../api/service/service.model'),
Plan = require('../api/plan/plan.model'),
BillingSchedule = require('../api/billing/schedule/schedule.model'),
BillingMethod = require('../api/billing/method/method.model');

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


function seedPlans() {
  var defer = Q.defer();

  console.log('search & destroy existing plans..');

  Plan
    .find({})
    .remove(function(err) {
      if(err) {
        return defer.reject(err);
      }

      console.log('seeding test plans..');

      Plan.create({
        groupDefault: true,
        order: 1,
        name: 'Bronze Plan',
        description: 'Description for bronze plan goes here',
        monthlyCost: 0
      }, {
        order: 2,
        name: 'Silver Plan',
        description: 'Description for silver plan goes here',
        monthlyCost: 250
      }, {
        order: 3,
        name: 'Gold Plan',
        description: 'Description for gold plan goes here',
        monthlyCost: 1000
      }, function (err, svBronze, svSilver, svGold) {
          if(err) {
            return defer.reject(err);
          }

          var plans = [svBronze, svSilver, svGold];

          console.log('finished seeding %d test plans', plans.length);

          defer.resolve(plans);
        }
      );

    });

  return defer.promise;
}

function seedBillingSchedules() {
  var defer = Q.defer();

  console.log('search & destroy existing billing schedules..');

  BillingSchedule
    .find({})
    .remove(function(err) {
      if(err) {
        return defer.reject(err);
      }

      console.log('seeding test billing schedules..');

      BillingSchedule.create({
        order: 1,
        interval: BillingSchedule.INT_MONTHLY,
        name: 'Monthly',
        description: 'Description of monthly billing schedule can go here'
      },{
        order: 2,
        interval: BillingSchedule.INT_QUARTERLY,
        name: 'Quarterly',
        description: 'Description of quarterly billing schedule can go here',
        discount: {
          amount: 5,
          method: BillingSchedule.DCMETH_PERC
        }
      },{
        groupDefault: true,
        order: 3,
        interval: BillingSchedule.INT_YEARLY,
        name: 'Annually',
        description: 'Description of annual billing schedule can go here',
        discount: {
          amount: 15,
          method: BillingSchedule.DCMETH_PERC
        }
      }, function (err, bsMonthly, bsQuarterly, bsAnnual) {
          if(err) {
            return defer.reject(err);
          }

          var billingSchedules = [bsMonthly, bsQuarterly, bsAnnual];

          console.log('finished seeding %d test billing schedules', billingSchedules.length);

          defer.resolve(billingSchedules);
        }
      );

    });

  return defer.promise;
}

function seedBillingMethods() {
  var defer = Q.defer();

  console.log('search & destroy existing billing methods..');

  BillingMethod
    .find({})
    .remove(function(err) {
      if(err) {
        return defer.reject(err);
      }

      console.log('seeding test billing methods..');

      BillingMethod.create({
        groupDefault: true,
        order: 1,
        name: 'Credit Card',
        adapter: {
          factoryClass: 'credit-card',
          options: {
            types: [
              ['visa', 'Visa'],
              ['mastercard', 'Mastercard'],
              ['amex', 'American Express'],
              ['discover', 'Discover'],
              ['diners', 'Dinerscard']
            ]
          }
        }
      },{
        order: 2,
        name: 'Paypal',
        adapter: {
          factoryClass: 'paypal'
        }
      }, function (err, bmCreditCard, bmPaypal) {
          if(err) {
            return defer.reject(err);
          }

          var billingMethods = [bmCreditCard, bmPaypal];

          console.log('finished seeding %d test billing schedules', billingMethods.length);

          defer.resolve(billingMethods);
        }
      );

    });

  return defer.promise;
}

//
// Complex associations
//

function seedGroups(plans, bSchedule, bMethod) {
  var
  defer = Q.defer(),

  // plans
  svBronze = plans[0],
  svSilver = plans[1],
  svGold   = plans[2],

  // billing schedules
  bsMonthly   = bSchedule[0],
  bsQuarterly = bSchedule[1],
  bsAnnual    = bSchedule[2],

  // billing methods
  bmCreditCard = bMethod[0],
  bmPaypal     = bMethod[1],

  bmMock = [
    {
      method: bmCreditCard,
      detail: {
        cardHolder: 'XX YY ZZ',
        cardType: 'mastercard',
        cardNumber: '12345-12345-12345-12345',
        cardExpireYear: '2023',
        cardExpireMonth: '12',
        cardCV: '123'
      }
    },
    {
      method: bmPaypal,
      detail: {
        ppAccountHolder: 'XX YY ZZ',
        ppAggreementId: '12345-12345-12345-12345',
        ppHolderEmail: 'xxx@yyy.com'
      }
    }
  ],
  dateToday = (new Date()).toISOString(),
  dateBeginMonth = moment(dateToday).startOf('month').utc().toString(),
  dateLastMonth = moment(dateToday).startOf('month').subtract(1, 'month').utc().toString();

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
        servicePlan: svGold,
        billingSchedule: bsAnnual,
        billingMethod: bmMock[0],
        billingHistory: [{ // fake billing history
          method: bmMock[0].method,
          detail: bmMock[0].detail,
          date: dateBeginMonth,
          amount: 1000
        }, {
          method: bmMock[0].method,
          detail: bmMock[0].detail,
          date: dateLastMonth,
          amount: 1000
        }],
        invites: [{
          code: 'temporary-dev-code-0001',
          sent: false,
          name: 'Hans Doller',
          email: 'kryo2k@gmail.com',
          relationship: 'owner'
        }]
      }, {
        name: 'Silver Group',
        description: 'Silver test group',
        primaryDomain: 'http://hookupjs.org/',
        servicePlan: svSilver,
        billingSchedule: bsMonthly,
        billingMethod: bmMock[1],
        billingHistory: [{ // fake billing history
          method: bmMock[1].method,
          detail: bmMock[1].detail,
          date: dateBeginMonth,
          amount: 250
        }, {
          method: bmMock[1].method,
          detail: bmMock[1].detail,
          date: dateLastMonth,
          amount: 250
        }],
      }, {
        name: 'Bronze Group',
        description: 'Bronze test group',
        primaryDomain: 'http://hookupjs.org/',
        servicePlan: svBronze
      }, {
        name: 'Test Group 1',
        description: 'Bronze test group',
        primaryDomain: 'http://hookupjs.org/',
        servicePlan: svBronze
      }, {
        name: 'Test Group 2',
        description: 'Bronze test group',
        primaryDomain: 'http://hookupjs.org/',
        servicePlan: svBronze
      }, {
        name: 'Test Group 3',
        description: 'Bronze test group',
        primaryDomain: 'http://hookupjs.org/',
        servicePlan: svBronze
      }, {
        name: 'Test Group 4',
        description: 'Bronze test group',
        primaryDomain: 'http://hookupjs.org/',
        servicePlan: svBronze
      }, {
        name: 'Test Group 5',
        description: 'Bronze test group',
        primaryDomain: 'http://hookupjs.org/',
        servicePlan: svBronze
      }, function (err, goldGroup, silverGroup, bronzeGroup, tg1, tg2, tg3, tg4, tg5) {
          if(err) {
            return defer.reject(err);
          }

          var groups = [goldGroup, silverGroup, bronzeGroup, tg1, tg2, tg3, tg4, tg5];

          console.log('finished seeding %d test groups', groups.length);

          defer.resolve(groups);
        }
      );
    });

  return defer.promise;
}

function seedGroupsServices(groups, services) {
  var

  // groups order from promise
  groupGold   = groups[0],
  groupSilver = groups[1],
  groupBronze = groups[2],
  groupTest1  = groups[3],
  groupTest2  = groups[4],
  groupTest3  = groups[5],
  groupTest4  = groups[6],
  groupTest5  = groups[7],

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
  groupBronze = groups[2],
  groupTest1  = groups[3],
  groupTest2  = groups[4],
  groupTest3  = groups[5],
  groupTest4  = groups[6],
  groupTest5  = groups[7];

  [ // our test data fixtures
    [userTest,  groupBronze, Group.RELATION_OWNER],
    [userTest,  groupSilver, Group.RELATION_EDITOR],
    [userTest,  groupGold,   Group.RELATION_VIEWER],
    [userTest,  groupTest1,  Group.RELATION_OWNER],
    [userTest,  groupTest2,  Group.RELATION_EDITOR],
    [userTest,  groupTest3,  Group.RELATION_VIEWER],
    [userTest,  groupTest4,  Group.RELATION_OWNER],
    [userTest,  groupTest5,  Group.RELATION_EDITOR],
    [userAdmin, groupSilver, Group.RELATION_EDITOR],
    [userAdmin, groupGold,   Group.RELATION_OWNER],
    [userAdmin, groupTest1,  Group.RELATION_OWNER],
    [userAdmin, groupTest2,  Group.RELATION_OWNER],
    [userAdmin, groupTest3,  Group.RELATION_OWNER],
    [userAdmin, groupTest4,  Group.RELATION_OWNER],
    [userAdmin, groupTest5,  Group.RELATION_OWNER]
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
    Q.nbind(groupBronze.save, groupBronze)(),
    Q.nbind(groupTest1.save, groupTest1)(),
    Q.nbind(groupTest2.save, groupTest2)(),
    Q.nbind(groupTest3.save, groupTest3)(),
    Q.nbind(groupTest4.save, groupTest4)(),
    Q.nbind(groupTest5.save, groupTest5)()
  ]);
}

Q.allSettled([ // create fixtures
  seedPlans(),
  seedBillingSchedules(),
  seedBillingMethods(),
  seedUsers(),
  seedServices()
]).spread(function (seededPlans, seededBillingSchedules, seededBillingMethods, seededUsers, seededServices) {

  // seed groups with other seeded fixtures.
  return seedGroups(seededPlans.value, seededBillingSchedules.value, seededBillingMethods.value)
    .then(function (seededGroups) {
      return seedGroupsServices(seededGroups, seededServices.value)
        .then(function (modifiedGroups) {
          return seedUsersGroups(seededUsers.value, seededGroups)
        })
        .then(function (modifiedUsers) {
          return [seededPlans.value, seededBillingSchedules.value, seededBillingMethods.value, seededUsers.value, seededServices.value, seededGroups];
        });
    });
})
.then(function (results) {
  console.log('All data seeded successfully');
})
.catch(function (err){
  console.error(err.stack || err);
}).done();