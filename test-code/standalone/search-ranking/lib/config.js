'use strict';

module.exports = {
  mongoURI:  process.env.MONGO_URI      || 'mongodb://localhost/search-ranking',
  keywordQuery: {
    pages: 1,
    pageSize: 10,
    cx:  process.env.GOOGLE_CSE_CX  || '-- invalid key --',
    auth: process.env.GOOGLE_CSE_KEY || '-- invalid key --'
  }
};