hookupJS is a free, open source app in Angular, Mongo, Express, Node and a list of other components.
What does it do?
Create images / memes online with beautiful images, score your Facebook page, schedule posts and even more, coming soon.

More details:
Node / Mongoose database
Angular / Express front end & backend
API Integration from Google Custom Search

Requirements:
======

+ NPM / NodeJS
+ Git
+ Ruby 1.9.3+

Installation:
======

+ `git clone /path/to/hookupjs.git`
+ `npm install && bower install`
+ `gem install sass bourbon`

Init script:
======

I found this makes life a little easier, you'll need to tweak this file according to your environment.

__For development mode with grunt:__ `hookupjs-start-development.sh`

    #!/bin/sh
    export HOOKUP_URL="http://full-domain-name-here"
    export HOOKUP_AWS_SENDER="verified-sender@amznses.com"
    export HOOKUP_AWS_ACCESSKEYID="VALIDAWSACCESSKEY"
    export HOOKUP_AWS_KEYSECRET="VALID/AWS/Secret/key"
    export MONGO_URI="mongodb://your-mongo-server-ip/hookupjs-dev"
    export PORT=9991
    cd /path/to/hookupjs
    grunt serve

__For production mode with grunt:__ `hookupjs-start-production.sh`

    #!/bin/sh
    export HOOKUP_URL="http://full-domain-name-here"
    export HOOKUP_AWS_SENDER="verified-sender@amznses.com"
    export HOOKUP_AWS_ACCESSKEYID="VALIDAWSACCESSKEY"
    export HOOKUP_AWS_KEYSECRET="VALID/AWS/Secret/key"
    export MONGO_URI="mongodb://your-mongo-server-ip/hookupjs"
    export PORT=9990
    cd /path/to/hookupjs
    grunt serve:dist

__For production mode *without* grunt:__ `hookupjs-start-dist.sh`

Note, bower install will have no effect as the modules are checked into git. Npm install is still required!

    #!/bin/sh
    export NODE_ENV="production"
    export HOOKUP_URL="http://full-domain-name-here"
    export HOOKUP_AWS_SENDER="verified-sender@amznses.com"
    export HOOKUP_AWS_ACCESSKEYID="VALIDAWSACCESSKEY"
    export HOOKUP_AWS_KEYSECRET="VALID/AWS/Secret/key"
    export MONGO_URI="mongodb://your-mongo-server-ip/hookupjs"
    export PORT=9990
    cd /path/to/hookupjs
    grunt serve:dist
    node dist/server/app.js
