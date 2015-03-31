'use strict';

var
Q = require('q'),
path = require('path'),
jade = require('jade'),
nodemailer = require('nodemailer'),
sesTransport = require('nodemailer-ses-transport'),
BackgroundService = require('./index'),
config  = require('../../config/environment'),
Group = require('../../api/group/group.model');

var
ISCFG = config.inviteService,
VIEWPATH = path.join(config.root, 'server/views/'),
EMAILVIEWPATH = path.join(VIEWPATH, 'emails/');

function systemMailer() {
  return nodemailer.createTransport(sesTransport(config.mailer));
}

function mailPromised(group, invite) {
  return function (output) {
    output = output || [];

    var
    defer = Q.defer(),
    redeemUrl = config.publicUrl + '/redeem-invite/' + invite.code,
    // generate a template fn
    tpl = jade.compileFile(path.join(EMAILVIEWPATH, 'group-invitation.jade'), {
      pretty: true
    }),
    // compile the template fn into html
    html = tpl({
      baseUrl: config.publicUrl,
      redeemUrl: redeemUrl,
      group: group,
      invite: invite
    }),
    // opts to send to nodemailer
    mailOpts = {
      from: ISCFG.fromEmail, // sender address
      subject: ISCFG.subject,
      to: (!!invite.name ? (invite.name + ' <' + invite.email + '>') : invite.email),
      text: 'If you are not able to view HTML, please this page to continue: ' + redeemUrl,
      html: html
    };

    systemMailer().sendMail(mailOpts, function (err, info) {
      if(!!err) return defer.reject(err);
      console.log('Mail sent to: (%s: %s) %j', invite.email, invite.name, info);
      output.push(info);
      defer.resolve(output);
    });

    return defer.promise;
  };
}

module.exports = new BackgroundService({
  autoStart: true,
  checkInterval: ISCFG.checkInterval,
  checkFunction: function() {
    var defer = Q.defer();

    Group.findWithPendingInvites()
      .exec(function (err, groups) {
        if(err) return defer.reject(err);

        console.log('Found %d group(s) with pending invites..', groups.length);

        var
        mailQueue = Q([]);

        groups.forEach(function (group) {

          // process pending invites
          group.getPendingInvites()
            .forEach(function (invite) {
              console.log('Preparing Queue invite (%s: %s)..', invite.email, invite.name);
              mailQueue = mailQueue
                .then(mailPromised(group, invite))
                .then(function (mailInfo) {
                  console.log(mailInfo);
                  invite.sent = true;
                });
            });

          // save changes to the group (invites)
          mailQueue = mailQueue
            .then(function (output) {
              var defer = Q.defer();
              group.save(function (err) {
                if(err) {
                  return defer.reject(err);
                }

                defer.resolve(output);
              });
              return defer.promise;
            });
        });

        mailQueue
          .then(defer.resolve)
          .catch(defer.reject);

        return mailQueue;
      });

    return defer.promise;
  }
});