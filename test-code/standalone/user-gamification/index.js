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
      'Invite 3 Members Achievement',
      'Should be awarded for inviting 3 members.',
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
      }]
    ],
    [
      'Invite 3 Members (Same Group) Achievement',
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

    achievements.forEach(function (achievement) {
      if(achievement.matchesConditions(userLog)) {
        console.log('achievement (%s) matches conditions', achievement.name);
      }
      else {
        console.log('achievement (%s) does not match conditions', achievement.name);
      }
    });

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


/*

'use strict';

var
mongoose = require('mongoose'),
Schema = mongoose.Schema;

var
GroupSchema = new Schema({
  name: String,
  members: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    role: String
  }]
}),
Group = mongoose.model('Group', GroupSchema);

var
AchievementSchema = new Schema({
  title:        String,
  description:  String,
  glyph:        String,
  bragWorthy:   Boolean,
  notify:       Boolean,
  required:     Boolean,
  requireOrder: Number
}),
Achievement = mongoose.model('Achievement', AchievementSchema);

AchievementSchema.statics = {
  normalizePercentage: function (percent) {
    percent = parseFloat(percent);
    if(isNaN(percent)) return 0;
    return Math.max(0, Math.min(1, percent));
  },
  seedUserRequired: function (user) {
    return this.find({required: true})
      .sort({requireOrder: 1})
      .exec(function (err, docs) { // load all possible achievements
        if(err) throw err;
        if(!docs.length) return docs;
        if(!user.achievements) throw new Error('User is missing achievements');

        var // reindex user data for easy lookup
        userAchievements = user.getAchievementIds(),
        missingAchievements = docs.filter(function (achievement) {
          return userAchievements.indexOf(String(achievement._id)) === -1;
        });

        missingAchievements.forEach(function (achievement) {
          user.addAchievement(achievement);
        });

        return missingAchievements;
      });
  }
};

AchievementSchema.methods = {
};

var
UserSchema = new Schema({
  name: String,
  email: String,
  achievements: [{
    achievement: {
      type: Schema.Types.ObjectId,
      ref: 'Achievement'
    },
    percentComplete: Number,
    dateIssued: {
      type: Date,
      default: Date.now
    },
    dateCompleted: Date
  }],
  notifications: [{
    cat: String,
    title: String,
    description: String,
    acknowledged: Boolean
  }],
  log: [{
    cat: String,
    action: String,
    data: Object,
    time: {
      type: Date,
      default: Date.now
    }
  }]
}),
User = mongoose.model('User', UserSchema);

UserSchema.statics = {
  LOG_ACCOUNT:      'account',
  ACCOUNT_CREATE:   'create',
  ACCOUNT_UPDATE:   'update',
  ACCOUNT_LOGIN:    'login',
  ACCOUNT_LOGOUT:   'logout',
  ACCOUNT_AGREETOS: 'tos',
  ACCOUNT_CHANGEPW: 'change-password',

  LOG_GROUP:        'group',
  GROUP_CREATE:     'create',
  GROUP_UPDATE:     'update',
  GROUP_REMOVE:     'remove',
  GROUP_JOIN:       'join',
  GROUP_LEAVE:      'leave',
  GROUP_INVITE:     'invite',
  GROUP_INVITED:    'invited',
  GROUP_RECRUIT:    'recruit',

  LOG_BILLING:      'billing',
  BILLING_ADD:      'add',
  BILLING_UPDATE:   'update',
  BILLING_REMOVE:   'remove',
  BILLING_CHARGE:   'charge',
  BILLING_ERROR:    'error'
};

UserSchema.methods = {

  notify: function(category, title, description) {
    this.notifications.push({
      cat: category,
      title: title,
      description: description
    })
  },

  unreadNotifications: function () {
    return this.notifications
      .filter(function (n) {
        return !n.acknowledged;
      });
  },

  markReadNotifications: function () {
    this.unreadNotifications()
      .forEach(function (n) {
        n.acknowledged = true;
      });
  },

  logEntry: function(category, action, data) {
    this.log.push({
      cat: category,
      action: action,
      data: data
    })
  },

  checkAchievementComplete: function(achievement) {
    if(achievement.percentComplete === 1 && !achievement.dateCompleted) {
      achievement.dateCompleted = Date.now;
    }

    return achievement;
  },

  hasAchievement: function(achievementId) {
    return !this.achievements.every(function (achiev) {
      return !(achiev._id||achiev).equals(achievementId);
    });
  },

  getAchievementIds: function() {
    return user.achievements
      .map(function (achievement) {
        return String(achievement._id || achievement); // reduce to object id
      });
  },

  addAchievement: function(achievement, percentComplete) {
    var
    normalPct = this.model('Achievement').normalizePercentage;

    this.achievements.push(this.checkAchievementComplete({
      achievement: achievement,
      percentComplete: normalPct(percentComplete)
    }));
  },

  setAchievementProgress: function(achievementId, percent, add) {
    var
    normalPct = this.model('Achievement').normalizePercentage;

    return !this.achievements.each(function (achievement) {
      var
      objectId = achievement._id || achievement;

      if(objectId.equals(achievementId)) {

        achievement.percentComplete = normalPct(add
          ? (achievement.percentComplete + percent)
          : percent);

        this.checkAchievementComplete(achievement);
        return false;
      }

      return true;
    });
  }
};

//
// test code
//

var
testGroup = new Group({
  name: 'Test Group'
}),
testUser1 = new User({
  name: 'Test User 1',
  email: 'test1@test.com'
}),
testUser2 = new User({
  name: 'Test User 2',
  email: 'test2@test.com'
}),
testAchievements = [
  new Achievement({
    title: 'Create a HookupJS account',
    description: 'Successfully create an account with Hookup JS.',
    notify: true
  }),
  new Achievement({
    title: 'Login to account',
    description: 'Successfully log in to your account.'
  }),
  new Achievement({
    title: 'Link a Facebook account',
    description: 'Successfully linked your Facebook account to your Hookup JS.',
    notify: true
  }),
  new Achievement({
    title: 'Create a group',
    description: 'Successfully create a new group in your account.'
  }),
  new Achievement({
    title: 'Invite a team member',
    description: 'Successfully invite a user to your group.'
  }),
  new Achievement({
    title: 'Invite 5 team members',
    description: 'Successfully invite 5 team members to your group.'
  }),
  new Achievement({
    title: 'Invite 25 team members',
    description: 'Successfully invite 25 team members to your group.'
  })
];

// user 1 signs up
testUser1.logEntry(User.LOG_ACCOUNT, User.ACCOUNT_CREATE);

// user 1 logs in
testUser1.logEntry(User.LOG_ACCOUNT, User.ACCOUNT_LOGIN, {
  ip:     '0.0.0.0',
  device: 'browser'
});

// user 1 creates group
testUser1.logEntry(User.LOG_GROUP, User.GROUP_CREATE, {
  group:  testGroup._id
});

// user 1 invites user 2 (via email)
testUser1.logEntry(User.LOG_GROUP, User.GROUP_INVITE, {
  email:  'test2@test.com',
  group:  testGroup._id
});

// user 2 signs up
testUser2.logEntry(User.LOG_ACCOUNT, User.ACCOUNT_CREATE);

//
// In between these processes something magical has to happen.
//

// user 2 gets automatically invited to group (via email)
testUser2.logEntry(User.LOG_GROUP, User.GROUP_INVITED, {
  by_user: testUser1._id
  group: testGroup._id
});

testUser2.logEntry(User.LOG_GROUP, User.GROUP_JOIN, {
  group: testGroup._id
});

// user 1 gets recruitment notification?
testUser1.logEntry(User.LOG_GROUP, User.GROUP_RECRUIT, {
  user:   testUser2._id,
  group:  testGroup._id
});

//
testUser1.logEntry(User.LOG_ACCOUNT, User.ACCOUNT_LOGOUT);
testUser2.logEntry(User.LOG_ACCOUNT, User.ACCOUNT_LOGOUT);

*/