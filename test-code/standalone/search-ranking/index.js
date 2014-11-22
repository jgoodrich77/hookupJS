'use strict';

var // external libs
util = require('util'),
Q = require('q'),
mongoose = require('mongoose'),
minimist = require('minimist');

var
Logger = require('./lib/logger'),
config = require('./lib/config'),
opts = minimist(process.argv.slice(2), {
  boolean: ['h','v'],
  alias: {
    h: 'help',
    v: 'verbose'
  }
});

function printUsage(exit) {
  var
  cfgKwQuery = config.keywordQuery,
  fmt = util.format;

  console.log([
    '',
    '  Usage: node index.js [action] [opts]',
    '',
    '-- Global Options --',
    '',
    '  -h|--help             show this screen',
    '  -v|--verbose          enable verbose output',
    '',
    '-- Available Actions --',
    '',
    '  fetch',
fmt('    -C <str>            Google CX key to use (default: %j)', cfgKwQuery.cx),
fmt('    -K <str>            Google API key to use (default: %j)', cfgKwQuery.auth),
fmt('    -n <int>            number of pages to fetch (default: %d)', cfgKwQuery.pages),
fmt('    -p <int>            number of results per page (default: %d)', cfgKwQuery.pageSize),
    '    -d|--date=<str>     fetch data for keywords that have not been fetched since',
    '                        before this date.',
    '    -i|--import         import keywords that are not in the database already',
    '                        (otherwise they will be skipped)',
    '    -t|--tag=<str>      when combined with import, applies tag to all keywords',
    '                        matched. If import is not provided, ignores --keyword and --file,',
    '                        and only fetches for keywords tagged with tag. This can work',
    '                        combined with --date option as well.',
    '    -k|--keyword=<str>  fetch ranking results for a single keyword',
    '    -f|--file=<file>    fetch ranking results for a list of keywords in a file',
    '',
    '  flush',
    '    --all               flush all data',
    '    --keywords          flush keywords only',
    '    --checks            flush keyword check results only',
    '    -t|--tag=<str>      filters flushing (--keywords|--checks) to keywords',
    '                        tagged with tag only.',
    '    -o|--only-tag       works combined with -t|--tag, will flush the keyword if it',
    '                        only has the one tag searched for. If multiple tags exists,',
    '                        it will remove only the tag for the keyword.',
    '',
    '  list',
    '    -a|--all            show all the keywords in the system',
    '    -q|--query=<str>    show all keywords that meet the match criteria',
    '    -t|--tag=<str>      show all keywords that are tagged with tag.',
    '    -r|--results        show latest stored results for listed keywords',
    '    -T|--title          show title of the result (depends on -r|--results)',
    '    -s|--snippet        show snippet of the result (depends on -r|--results)',
    ''
    ].join('\n'));

  if(!!exit) {
    process.exit(exit);
  }
}

var
logger = new Logger(!!opts.v),
action = process.argv[2],
actionMap = {
  'flush'  : require('./lib/action/flush'),
  'fetch'  : require('./lib/action/fetch'),
  'list'   : require('./lib/action/list')
};

if(opts.h || actionMap[action] === undefined) {
  return printUsage(actionMap[action] === undefined ? 1 : 2);
}

// connect mongo:
mongoose.connect(config.mongoURI, {
  db: {
    safe: true
  }
});

action = new actionMap[action](
  minimist(process.argv.slice(3),actionMap[action].minimistOpts),
  logger
);

Q.when(action.run())
  .then(function (result) {
    logger.debug('Result: %j', result);
  })
  .catch(function (err) {
    logger.error(util.isError(err) ? err.stack : err);
  })
  .finally(function () {
    mongoose.disconnect();
  });;