'use strict';

angular.module('auditpagesApp')
  .factory('Modal', function ($rootScope, $modal, $http) {
    /**
     * Opens a modal
     * @param  {Object} scope      - an object to be merged with modal's scope
     * @param  {String} modalClass - (optional) class(es) to be applied to the modal
     * @return {Object}            - the instance $modal.open() returns
     */
    function openModal(scope, modalClass) {
      var modalScope = $rootScope.$new();
      scope = scope || {};
      modalClass = modalClass || 'modal-default';

      angular.extend(modalScope, scope);

      return $modal.open({
        templateUrl: 'components/modal/modal.html',
        windowClass: modalClass,
        scope: modalScope
      });
    }

    // Public API here
    return {

      /* Confirmation modals */
      confirm: {

        /**
         * Create a function to open a delete confirmation modal (ex. ng-click='myModalFn(name, arg1, arg2...)')
         * @param  {Function} del - callback, ran when delete is confirmed
         * @return {Function}     - the function to open the modal (ex. myModalFn)
         */
        delete: function(del) {
          del = del || angular.noop;

          /**
           * Open a delete confirmation modal
           * @param  {String} name   - name or info to show on modal
           * @param  {All}           - any additional args are passed staight to del callback
           */
          return function() {
            var args = Array.prototype.slice.call(arguments),
                name = args.shift(),
                deleteModal;

            deleteModal = openModal({
              modal: {
                dismissable: true,
                title: 'Confirm Delete',
                html: '<p>Are you sure you want to delete <strong>' + name + '</strong> ?</p>',
                buttons: [{
                  classes: 'btn-danger',
                  text: 'Delete',
                  click: function(e) {
                    deleteModal.close(e);
                  }
                }, {
                  classes: 'btn-default',
                  text: 'Cancel',
                  click: function(e) {
                    deleteModal.dismiss(e);
                  }
                }]
              }
            }, 'modal-danger');

            deleteModal.result.then(function(event) {
              del.apply(event, args);
            });
          };
        }
      },

      scheduleAdd: function(add, currentUserId) {
        add = add || angular.noop;

        return function (date, period, records, prevValidation) {
          var
          modal, scopeRes = {
            date: date,
            period: period
          };

          modal = openModal({
            modal: {
              dismissable: true,
              title: 'Add Schedule',
              template: 'components/modal/tpl/tpl.schedule-add.html',
              buttons: [{
                classes: 'btn-success',
                text: 'Schedule Post',
                click: function(e) {
                  modal.close(e);
                }
              }, {
                classes: 'btn-default',
                text: 'Cancel',
                click: function(e) {
                  modal.dismiss(e);
                }
              }]
            },
            result: scopeRes,
            existingRecords: records,
            validation: prevValidation,
            cancelScheduledJob: function(record, index) {
              var scope = this;
              $http.delete('/api/user-schedule/'+record.jobId)
                .then(function (response) {
                  records.splice(index, 1);
                  scope.showExisting = (records.length > 0);
                });
            },
            toggleShowingRecord: function(record) {
              if(!record || !!record.loading) return;

              if(!record.isShowing) {
                record.loading = true;
                record.isShowing = false;

                $http.get('/api/user-schedule/'+record.jobId)
                  .then(function (response) {
                    var userId = (response.data||{data: {}}).data.userId;
                    record.loading = false;
                    record.isShowing = true;
                    record.isUsersJob = (currentUserId === userId);
                    record.detail = response.data;
                  })
                  .finally(function () {
                    record.loading = false;
                  });
              }
              else {
                record.isShowing = false;
                record.detail = undefined;
              }
            }
          }, 'modal-success');

          modal.result.then(function (event) {
            add.call(event, scopeRes);
          });
        };
      },

      scheduleView: function(close, currentUserId) {
        close = close || angular.noop;
        return function (date, period, records) {
          var
          modal, scopeRes = {
            date: date,
            period: period
          };

          modal = openModal({
            modal: {
              dismissable: true,
              title: 'Posts Published',
              template: 'components/modal/tpl/tpl.schedule-view.html',
              buttons: [{
                classes: 'btn-default',
                text: 'Close',
                click: function(e) {
                  modal.dismiss(e);
                }
              }]
            },
            existingRecords: records,
            toggleShowingRecord: function(record) {
              if(!record || !!record.loading) return;

              if(!record.isShowing) {
                record.loading = true;
                record.isShowing = false;

                $http.get('/api/user-schedule/'+record.jobId)
                  .then(function (response) {
                    var userId = (response.data||{data: {}}).data.userId;
                    record.loading = false;
                    record.isShowing = true;
                    record.isUsersJob = (currentUserId === userId);
                    record.detail = response.data;
                  })
                  .finally(function () {
                    record.loading = false;
                  });
              }
              else {
                record.isShowing = false;
                record.detail = undefined;
              }
            }
          }, 'modal-success');

          modal.result.then(function (event) {
            close.call(event, scopeRes);
          });
        };
      }
    };
  });
