'use strict';

/**
 * Facebook model
 */
'use strict';

var
mongoose = require('mongoose'),
Schema = mongoose.Schema;

var
FacebookSchema = new Schema({
  fbUserId: {
    type: String,
    required: true
  },
  localUser: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
});

/**
 * Validations
 */

/**
 * Methods
 */
FacebookSchema.methods = {
};

module.exports = mongoose.model('Facebook', FacebookSchema);
