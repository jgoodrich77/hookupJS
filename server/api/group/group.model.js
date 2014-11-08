'use strict';

var
_ = require('lodash'),
mongoose = require('mongoose'),
Schema = mongoose.Schema;

var
GroupSchema = new Schema({
  name: String,
  description: String,
  primaryDomain: String,
  servicePlan: {
    type: String,
    default: 'bronze',
    enum: [
      'bronze',
      'silver',
      'gold'
    ]
  },
  members: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    relationship: {
      type: String,
      enum: [
        'owner',
        'editor',
        'viewer'
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
  RELATION_OWNER: 'owner',
  RELATION_EDITOR: 'editor',
  RELATION_VIEWER: 'viewer',
  SVCPLAN_BRONZE: 'bronze',
  SVCPLAN_SILVER: 'silver',
  SVCPLAN_GOLD:   'gold',

  relationshipPriority: function(rel) {
    return GroupSchema.statics.memberRelationships.indexOf(rel);
  },

  // should be enfored on model level via enum,
  // but this is here incase we need to validate programmatically.
  validRelationship: function(r) {
    return GroupSchema.statics.memberRelationships.indexOf(r) > -1;
  },
  validPlan: function(r) {
    return GroupSchema.statics.servicePlans.indexOf(r) > -1;
  }
};

GroupSchema.statics.memberRelationships = [ // order is important here (for promotion / demotion algorithm)!
  GroupSchema.statics.RELATION_OWNER,
  GroupSchema.statics.RELATION_EDITOR,
  GroupSchema.statics.RELATION_VIEWER
];

GroupSchema.statics.servicePlans = [
  GroupSchema.statics.SVCPLAN_BRONZE,
  GroupSchema.statics.SVCPLAN_SILVER,
  GroupSchema.statics.SVCPLAN_GOLD
];

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

        return (found !== -1);
      });
    }

    return found;
  },

  findUserIndex: function (user) {
    var
    userId = user._id || user,
    found = -1;

    if(this.members.length) {
      this.members.every(function (member, index) {

        if(member.user.equals(userId)) {
          found = index;
        }

        return (found !== -1);
      });
    }

    return found;
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
    relPrio     = GroupSchema.statics.relationshipPriority,
    sUserRelPri = relPrio(this.members[sUserIndex].relationship),
    tUserRelPri = relPrio(this.members[tUserIndex].relationship),
    tRelPri     = relPrio(tRelationship);

    if(tRelPri < sUserRelPri) {
      throw new Error('Source user can not promote target user higher than their own relationship in this group.');
    }
    else if(tUserRelPri < sUserRelPri) {
      throw new Error('Source user does not have permissions to modify the target user\'s group relationship.');
    }

    return this.modifyRegisteredUser(tUserRelPri, tRelationship);
  },

  getSubscriptionDetail: function(user) {
    var
    userIndex = this.findUserIndex(user);

    if(userIndex === -1) {
      return false;
    }

    return {
      '_id':         this._id,
      'name':        this.name,
      'description': this.description,
      'role':        this.members[userIndex].relationship
    };
  }
};

module.exports = mongoose.model('Group', GroupSchema);