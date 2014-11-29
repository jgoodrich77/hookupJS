'use strict';

var
Q = require('q'),
mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/user-gamification', {
  db: {
    safe: true
  }
});

var
Achievement = require('./lib/model/achievement'),
User        = require('./lib/model/user'),
UserLog     = require('./lib/model/user-log');

function seedAchievements() {
  var
  def = Q.defer(),
  seed = [
    [
      'Recruit 3 new site members Achievement',
      'Should be awarded for recruiting 3 members to the site.',
      {glyph: 'achievement-locked'},
      {glyph: 'achievement-unlocked'},
      [{
        trigger: Achievement.TARGET_MATCHEQMOREMUL,
        target: {
          category: UserLog.Category.group,
          action: UserLog.Action.Group.invite,
          detail: {
            email: '$different'
          }
        },
        multiplier: 3
      },{
        trigger: Achievement.TARGET_MATCHEQMOREMUL,
        target: {
          category: UserLog.Category.group,
          action: UserLog.Action.Group.recruit,
          detail: {
            user: '$different'
          }
        },
        multiplier: 3
      }]
    ],
    [
      'Invite 3 Members to the same group Achievement',
      'Should be awarded for inviting 3 members to the same group.',
      {glyph: 'achievement-locked'},
      {glyph: 'achievement-unlocked'},
      [{
        trigger: Achievement.TARGET_MATCHEQMOREMUL,
        target: {
          category: UserLog.Category.group,
          action: UserLog.Action.Group.invite,
          detail: {
            group: '$same',
            email: '$different'
          }
        },
        multiplier: 3
      }]
    ],
    [
      'Invite 10 Members Achievement',
      'Should be awarded for inviting 10 members.',
      {glyph: 'achievement-locked'},
      {glyph: 'achievement-unlocked'},
      [{
        trigger: Achievement.TARGET_MATCHEQMOREMUL,
        target: {
          category: UserLog.Category.group,
          action: UserLog.Action.Group.invite,
          detail: {
            email: '$different'
          }
        },
        multiplier: 10
      }]
    ]
  ];

  Achievement
    .find({})
    .remove(function (err) {
      if(err) {
        return def.reject(err);
      }

      var dresult = Q([]);

      seed.forEach(function (rec) {
        dresult = dresult
          .then(function (output) {
            return Q.nfcall(Achievement.create.bind(Achievement), {
                name: rec[0],
                description: rec[1],
                visual: {
                  locked: rec[2],
                  unlocked: rec[3]
                },
                conditions: rec[4]
              }).then(function (rec) {
                output.push(rec);
                return output;
              });
          });
      });

      def.resolve(dresult);
    });

  return def.promise;
}

function seedUser() {
  var
  def = Q.defer();

  User
    .find({})
    .remove(function (err) {
      if(err) {
        return def.reject(err);
      }

      User.create({
        name: 'Test User 1'
      }, function (err, user) {
        if(err) {
          return def.reject(err);
        }

        def.resolve(user);
      });
    });

  return def.promise;
}

function seedUserLog(user) {
  var
  def = Q.defer(),
  seed = [
    [user, UserLog.Category.account, UserLog.Action.Account.create],
    [user, UserLog.Category.account, UserLog.Action.Account.login, { ip: '0.0.0.0' }],
    [user, UserLog.Category.account, UserLog.Action.Account.logout, {}],
    [user, UserLog.Category.account, UserLog.Action.Account.login, { ip: '0.0.0.0' }],
    [user, UserLog.Category.group, UserLog.Action.Group.create,  { group: 'some-group-id'}],
    [user, UserLog.Category.group, UserLog.Action.Group.invite,  { group: 'some-group-id', email: 'some@user-email.com'}],
    [user, UserLog.Category.group, UserLog.Action.Group.recruit, { group: 'some-group-id', user:  'some-user-id'}],
    [user, UserLog.Category.group, UserLog.Action.Group.invite,  { group: 'some-group-id', email: 'some1@user-email.com'}],
    [user, UserLog.Category.group, UserLog.Action.Group.recruit, { group: 'some-group-id', user:  'some-user-id-1'}],
    [user, UserLog.Category.group, UserLog.Action.Group.invite,  { group: 'some-group-id-1', email: 'some2@user-email.com'}],
    [user, UserLog.Category.group, UserLog.Action.Group.recruit, { group: 'some-group-id-1', user:  'some-user-id-2'}]
  ];

  UserLog
    .find({})
    .remove(function (err) {
      if(err) {
        return def.reject(err);
      }

      var dresult = Q([]);

      seed.forEach(function (rec) {
        dresult = dresult
          .then(function (output) {
            return Q.nfcall(UserLog.create.bind(UserLog), {
                user:     rec[0],
                category: rec[1],
                action:   rec[2],
                detail:   rec[3]
              }).then(function (rec) {
                output.push(rec);
                return output;
              });
          });
      });

      def.resolve(dresult);
    });

  return def.promise;
}

function gradeUserAchievements(user) {
  return Q.all([
    Q.nfcall(Achievement.find.bind(Achievement), {}),
    Q.nfcall(UserLog.find.bind(UserLog), {
      user: user._id || user
    })
  ])
  .spread(function (achievements, userLog) {
    var userChanged = false;

    achievements.forEach(function (achievement) {
      if(achievement.matchesConditions(userLog)) {
        console.log('achievement (%s) matches conditions', achievement.name);

        if(user.addAchievement(achievement)) {
          userChanged = true;
          console.log('user (%s) was awarded achievement (%s)', user.name, achievement.name);
        }
        else {
          console.log('user (%s) was already awarded achievement (%s) on (%s)',
            user.name,
            achievement.name,
            user.getAchievementDate(achievement)
          );
        }
      }
      else {
        console.log('achievement (%s) did not match conditions', achievement.name);
      }
    });

    if(userChanged) {
      return Q.nfcall(user.save.bind(user))
        .then(function (savedUser) {
          return [achievements, userLog];
        });
    }

    return [achievements, userLog];
  });
}

seedAchievements()
  .then(function (achievements) {
    return seedUser();
  })
  .then(function (user) {
    return seedUserLog(user)
      .then(function (logs) {
        return gradeUserAchievements(user);
      })
      .then(function (grades) { // attempt to re-grade :D
        console.log('---- Re-grading attempt, you should see that the achievement was already rewarded! ----');
        return gradeUserAchievements(user);
      });
  })
  .then(function (grades) {
    return grades;
  })
  .catch(function (err) {
    console.error('error:', err);
    return err;
  })
  .finally(function(){
    console.log('finished');
    mongoose.disconnect();
  });