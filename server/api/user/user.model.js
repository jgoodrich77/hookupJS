'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');

var UserSchema = new Schema({
  role: {
    type: String,
    default: 'user'
  },
  name: String,
  email: {
    type: String,
    lowercase: true
  },
  birthday: Date,
  gender: String,
  hashedPassword: String,
  salt: String,
  facebookObj: {
    id: String
  },
  facebook: {
    id: String,
    token: String
  },
  setupStep: {
    type: Number,
    default: 1
  },
  active: {
    type: Boolean,
    default: false
  },
  agreeToS: Date,
  activationCode: String,
  achievements: [{
    achievement: {
      type: Schema.Types.ObjectId,
      ref: 'Achievement'
    },
    dateCompleted: {
      type: Date,
      default: Date.now
    }
  }],
  notifications: [{
    title: String,
    description: String,
    glyph: String,
    acknowledged: {
      type: Boolean,
      default: false
    }
  }]
});

/**
 * Virtuals
 */
UserSchema
  .virtual('password')
  .set(function(password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashedPassword = this.encryptPassword(password);
  })
  .get(function() {
    return this._password;
  });

// Public profile information
UserSchema
  .virtual('profile')
  .get(function() {
    return {
      'name': this.name,
      'email': this.email,
      'role': this.role,
      'settingUp': this.setupStep > -1
    };
  });

// Get the current setup progress for this user
UserSchema
  .virtual('setupStatus')
  .get(function() {
    return {
      'step': this.setupStep
    };
  });

/**
 * Validations
 */

// Validate empty email
// UserSchema
//   .path('email')
//   .validate(function(email) {
//     if (authTypes.indexOf(this.provider) !== -1) return true;
//     return email.length;
//   }, 'Email cannot be blank');

// // Validate empty password
// UserSchema
//   .path('hashedPassword')
//   .validate(function(hashedPassword) {
//     if (authTypes.indexOf(this.provider) !== -1) return true;
//     return hashedPassword.length;
//   }, 'Password cannot be blank');

// // Validate email is not taken
// UserSchema
//   .path('email')
//   .validate(function(value, respond) {
//     var self = this;
//     this.constructor.findOne({email: value}, function(err, user) {
//       if(err) throw err;
//       if(user) {
//         if(self.id === user.id) return respond(true);
//         return respond(false);
//       }
//       respond(true);
//     });
// }, 'The specified email address is already in use.');

// var validatePresenceOf = function(value) {
//   return value && value.length;
// };

// /**
//  * Pre-save hook
//  */
// UserSchema
//   .pre('save', function(next) {
//     if (!this.isNew) return next();

//     if (!validatePresenceOf(this.hashedPassword))
//       next(new Error('Invalid password'));
//     else
//       next();
//   });

/**
 * Statics
 */
UserSchema.statics = {
  findByFacebookId: function (id, cols, callback) {
    return this.findOne({
      'facebook.id': id
    }, cols, callback)
  },

  createFromFacebook: function(userId, userToken, fbMetaData) {
    return new this({ // create a new user with facebook user details
      active: true, // facebook accounts are immediately activated (but missing password)
      facebook: {
        id: userId,
        token: userToken
      },
      agreeToS: Date.now(),
      name: fbMetaData.name,
      email: fbMetaData.email,
      gender: fbMetaData.gender,
      birthday: !!fbMetaData.birthday
        ? new Date(fbMetaData.birthday)
        : null
    });
  }
};

var compareDates = function(v1, v2) {
  return Date.parse(v1) === Date.parse(v2);
};

/**
 * Methods
 */
UserSchema.methods = {

  updateFromFacebook: function(userToken, fbMetaData) {
    if(!userToken || !fbMetaData) return;

    if(!this.agreeToS) {
      this.agreeToS = Date.now();
    }

    if(this.facebook.token !== userToken) { // update the token?
      this.facebook.token = userToken;
    }

    if(!!fbMetaData.name && this.facebook.name !== fbMetaData.name) { // any other changed user info
      this.name = fbMetaData.name;
    }
    if(!!fbMetaData.email && this.facebook.email !== fbMetaData.email) {
      this.email = fbMetaData.email;
    }
    if(!!fbMetaData.gender && this.facebook.gender !== fbMetaData.gender) {
      this.gender = fbMetaData.gender;
    }
    if(!!fbMetaData.birthday && !compareDates(this.facebook.birthday, fbMetaData.birthday)) {
      this.birthday = new Date(fbMetaData.birthday);
    }
  },
  /**
   * Authenticate - check if the passwords are the same
   *
   * @param {String} plainText
   * @return {Boolean}
   * @api public
   */
  authenticate: function(plainText) {
    return this.encryptPassword(plainText) === this.hashedPassword;
  },

  /**
   * Make salt
   *
   * @return {String}
   * @api public
   */
  makeSalt: function() {
    return crypto.randomBytes(16).toString('base64');
  },

  /**
   * Make user activation code
   *
   * @return {String}
   * @api public
   */
  makeActivationCode: function() {
    var sum = crypto.createHash('sha1');
    sum.update(crypto.randomBytes(8));
    return sum.digest('hex');
  },

  /**
   * Encrypt password
   *
   * @param {String} password
   * @return {String}
   * @api public
   */
  encryptPassword: function(password) {
    if (!password || !this.salt) return '';
    var salt = new Buffer(this.salt, 'base64');
    return crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');
  }
};

module.exports = mongoose.model('User', UserSchema);
