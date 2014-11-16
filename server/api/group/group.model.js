'use strict';

var
_ = require('lodash'),
mongoose = require('mongoose'),
Schema = mongoose.Schema;

var
RELATION_OWNER = 'owner',
RELATION_EDITOR = 'editor',
RELATION_VIEWER = 'viewer';

var
COLS_BASIC_GLOBAL = [
  '_id',
  'active',
  'name',
  'description',
  'primaryDomain'
],
COLS_BASIC = [
  '_id',
  'name',
  'description',
  'primaryDomain'
],
COLS_BILLING = [
  '_id',
  'servicePlan',
  'billingSchedule',
  'billingMethod'
],
COLS_SERVICES = [
  '_id',
  'services'
],
COLS_MEMBERS = [
  '_id',
  'members',
  'invites'
];

var
GroupSchema = new Schema({
  active: {
    type: Boolean,
    default: true
  },
  name: {
    type: String,
    required: true
  },
  primaryDomain: {
    type: String,
    required: true
  },
  description: String,
  servicePlan: {
    type: Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  billingSchedule: {
    type: Schema.Types.ObjectId,
    ref: 'BillingSchedule'
  },
  billingMethod: {
    method: {
      type: Schema.Types.ObjectId,
      ref: 'BillingMethod'
    },
    detail: Object
  },
  billingHistory: [{
    method: {
      type: Schema.Types.ObjectId,
      ref: 'BillingMethod'
    },
    detail: Object,
    date: {
      type: Date,
      default: Date.now
    },
    amount: Number
  }],
  members: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    relationship: {
      type: String,
      required: true,
      enum: [
        RELATION_OWNER,
        RELATION_EDITOR,
        RELATION_VIEWER
      ]
    }
  }],
  invites: [{
    code: {
      type: String,
      required: true
    },
    sent: Boolean,
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    relationship: {
      type: String,
      required: true,
      enum: [
        RELATION_OWNER,
        RELATION_EDITOR,
        RELATION_VIEWER
      ]
    }
  }],
  services: [{
    service: {
      type: Schema.Types.ObjectId,
      ref: 'Service'
    },
    params: Object
  }]
});

GroupSchema.statics = {
  RELATION_OWNER:        RELATION_OWNER,
  RELATION_EDITOR:       RELATION_EDITOR,
  RELATION_VIEWER:       RELATION_VIEWER,
  COLS_BASIC_GLOBAL:     COLS_BASIC_GLOBAL,
  COLS_BASIC:            COLS_BASIC,
  COLS_BILLING:          COLS_BILLING,
  COLS_SERVICES:         COLS_SERVICES,
  COLS_MEMBERS:          COLS_MEMBERS,

  memberRelationships: [ // order is important here (for promotion / demotion algorithm)!
    RELATION_OWNER,
    RELATION_EDITOR,
    RELATION_VIEWER
  ],

  relationshipPriority: function(rel) {
    return GroupSchema.statics.memberRelationships.indexOf(rel);
  },

  // should be enfored on model level via enum,
  // but this is here incase we need to validate programmatically.
  validRelationship: function(r) {
    return GroupSchema.statics.memberRelationships.indexOf(r) > -1;
  },

  generateInviteCode: function(len, charSet) {
    len = len || 50;
    charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var randomString = '';
    for (var i = 0; i < len; i++) {
      var randomPoz = Math.floor(Math.random() * charSet.length);
      randomString += charSet.substring(randomPoz,randomPoz+1);
    }
    return randomString;
  }
};

GroupSchema.methods = {

  findServiceIndex: function (service) {
    var
    serviceId = service._id || service,
    found = -1;

    if(this.services.length) {
      this.services.every(function (service, index) {

        if(service.service.equals(serviceId)) {
          found = index;
        }

        return (found === -1);
      });
    }

    return found;
  },

  findUserIndex: function (user) {
    var
    userId = user._id || user,
    found = -1;

    if(!!this.members && this.members.length) {
      this.members.every(function (member, index) {
        var memberUserId = member.user._id || member.user;

        if(memberUserId.equals(userId)) {
          found = index;
        }

        return (found === -1);
      });
    }

    return found;
  },

  findUserRole: function(user) {

    var
    userIndex = this.findUserIndex(user);

    if(userIndex === -1) {
      return false;
    }

    return this.members[userIndex].relationship;
  },

  isServiceRegistered: function (service) {
    return this.findServiceIndex(service) > -1;
  },

  isUserRegistered: function (user) {
    return this.findUserIndex(user) > -1;
  },

  configureService: function (service, params) {

    var
    serviceIndex = this.findServiceIndex(service);

    if(serviceIndex === -1) { // create a new service entry with the supplied params:
      this.services.push({
        service: service,
        params: params
      })
    }
    else { // merge supplied params into group's service params
      _.merge(this.services[serviceIndex].params, params);
    }
  },

  registerUser: function (user, relationship) {

    if(this.isUserRegistered(user)) {
      return false;
    }

    this.members.push({
      user: user,
      relationship: relationship
    });

    return true;
  },

  modifyRegisteredUser: function(user, relationship) {
    var
    userIndex = this.findUserIndex(user);

    if(userIndex === -1) {
      return false;
    }

    this.members[userIndex].relationship = relationship;

    return true;
  },

  modifyRegisteredUserAcl: function(sUser, tUser, tRelationship) {

    var
    sUserIndex = this.findUserIndex(sUser),
    tUserIndex = this.findUserIndex(tUser);

    if(sUserIndex === -1) {
      throw new Error('Source user is not registered in this group');
    }
    else if(tUserIndex === -1) {
      throw new Error('Target user is not registered in this group');
    }
    else if(sUserIndex === tUserIndex) {
      throw new Error('Source and target users can not be the same.');
    }

    var
    sUserRole  = this.members[sUserIndex].relationship,
    tUserRole  = this.members[tUserIndex].relationship;

    if(this.isRoleEscalating(sUserRole, tRelationship)) {
      throw new Error('Source user can not promote target user higher than their own relationship in this group.');
    }
    else if(this.isRoleEscalating(tUserRole, sUserRole)) {
      throw new Error('Source user does not have permissions to modify the target user\'s group relationship.');
    }

    return this.modifyRegisteredUser(tUserRelPri, tRelationship);
  },

  roleAllowsDetail: function(role, detailType) {
    var roleMap = {};

    roleMap[RELATION_OWNER]  = ['basic','plan','billing','services','members'];
    roleMap[RELATION_EDITOR] = ['basic', 'services','members'];
    roleMap[RELATION_VIEWER] = ['basic', 'services'];

    if(roleMap[role] === undefined) {
      throw new Error('Unsupported role/relationship was provided.');
    }

    if(roleMap[role].indexOf(detailType) === -1) {
      return false;
    }

    return true;
  },

  isRoleEscalating: function(r1, r2) {
    var
    relPrio = GroupSchema.statics.relationshipPriority;

    return (relPrio(r2) < relPrio(r1));
  },

  roleCanInvite: function(role) {
    return [RELATION_OWNER, RELATION_EDITOR].indexOf(role) > -1;

  },

  hasInviteEmail: function(email) {
    email = email || '';
    return !this.invites.every(function (invite) {
      var found = email.toUpperCase() === invite.email.toUpperCase();
      return !found;
    });
  },

  addInvite: function(name, email, role) {
    if(!this.hasInviteEmail(email)) { // new invite
      this.invites.push({
        code: GroupSchema.statics.generateInviteCode(),
        sent: false,
        name: name,
        email: email,
        relationship: role
      });

      return true;
    }
    else { // already has this user
      return false;
    }
  },

  removeInvite: function(email) {
    email = email || '';
    if(this.hasInviteEmail(email)) { // new invite
      this.invites = this.invites.filter(function (v) {
        return v.email.toUpperCase() !== email.toUpperCase();
      });

      return true;
    }
    else { // no invite for this email
      return false;
    }
  },

  getUpdatableColumns: function(role) {
    var cols;

    switch(role) {
      case 'owner':
      cols = [].concat(
        COLS_BASIC,
        COLS_BILLING,
        COLS_SERVICES,
        COLS_MEMBERS
      );
      break;
      case 'editor':
      cols = [].concat(
        COLS_BASIC,
        COLS_SERVICES,
        COLS_MEMBERS
      );
      break;
      case 'viewer':
      cols = [];
      break;

      default:
      throw new Error('Unsupported group role is being used.');
    }

    return cols
      .filter(function(col) {
        return col !== '_id';
      });
  },

  getDetail: function(type) {
    var cols;

    switch(type) {
      case 'basicGlobal':
      case 'basic-global':
      cols = COLS_BASIC_GLOBAL;
      break;
      case 'basic':
      cols = COLS_BASIC;
      break;
      case 'billing':
      cols = COLS_BILLING;
      break;
      case 'service':
      case 'services':
      cols = COLS_SERVICES;
      break;
      case 'member':
      case 'members':
      cols = COLS_MEMBERS;
      break;

      default:
      throw new Error('Unsupported group detail is being requested.');
    }

    var
    model  = this,
    detail = cols.reduce(function (p, c) {
      if(model[c] !== undefined) {
        p[c] = model[c];
      }

      return p;
    }, {});

    return detail;
  },

  getAllRoleData: function(role) {
    var model = this;
    return this.getUpdatableColumns(role)
      .concat('_id') // add _id column
      .reduce(function (p, c) { // reduce into new data subset
        p[c] = model[c];
        return p;
      }, { role: role });
  }
};

module.exports = mongoose.model('Group', GroupSchema);