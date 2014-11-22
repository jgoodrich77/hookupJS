'use strict';

var
mongoose = require('mongoose'),
Schema = mongoose.Schema;

var
KeywordSchema = new Schema({
  query: {
    type: String,
    required: true
  },
  tags: [String]
});

function tagIsValid(tag) {
  if(!tag || typeof tag !== 'string') {
    return false;
  }
  return true;
}

function tagNormalize(tag) {
  if(!tagIsValid(tag)) {
    return false;
  }
  return tag
    .trim()
    .toUpperCase();
}

KeywordSchema.statics = {
  validTag: tagIsValid,
  normalizeTag: tagNormalize,
  findByTag: function(tag, cb) {
    return this.find({tags: tagNormalize(tag)}, cb);
  }
};

KeywordSchema.methods = {
  hasTag: function(tag) {
    tag = tagNormalize(tag);

    if(!tag) {
      return false;
    }

    return this.tags.indexOf(tag) > -1;
  },
  isOnlyTag: function(tag) {
    return this.hasTag(tag) && this.tags.length === 1;
  },
  addTag: function(tag) {
    tag = tagNormalize(tag);

    if(!tag) {
      throw new Error('Invalid tag was supplied.');
    }

    if(!this.hasTag(tag)) { // added tag
      this.tags.push(tag);
      return true;
    }
    else { // already has tag
      return false;
    }
  },
  removeTag: function(tag) {
    tag = tagNormalize(tag);

    if(!tag) {
      throw new Error('Invalid tag was supplied.');
    }

    if(this.hasTag(tag)) { // remove tag
      this.tags.splice(this.tags.indexOf(tag), 1);
      return true;
    }
    else { // does not have this tag
      return false;
    }
  },
  clearTags: function() {
    this.tags = [];
    return this;
  }
};

module.exports = mongoose.model('Keyword', KeywordSchema);