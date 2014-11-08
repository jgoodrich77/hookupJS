Angular-fullstack based app coming soon.
==========

Node / Mongoose database
Angular / Express front end & backend
API Integration from Google Custom Search

Installation:
======

+ `git clone /path/to/hookupjs.git`
+ `npm install && bower install`
+ `gem install sass bourbon`

Init script:
======

I found this makes life a little easier, you'll need to tweak this file according to your environment.

__For development mode:__ `hookupjs-start-development.sh`

    #!/bin/sh
    export MONGO_URI="mongodb://your-mongo-server-ip/hookupjs-dev"
    export PORT=9991
    cd /path/to/hookupjs
    grunt serve

__For production mode:__ `hookupjs-start-production.sh`

    #!/bin/sh
    export MONGO_URI="mongodb://your-mongo-server-ip/hookupjs"
    export PORT=9990
    cd /path/to/hookupjs
    grunt serve:dist --force