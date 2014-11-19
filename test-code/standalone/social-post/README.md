
## Installation
- Extract archive and install node dependencies using `npm install`.

- Set the following environment variables:
  ```bash
  export FB_APP_ID='-- your facebook app id --'
  export FB_APP_SECRET='-- your facebook app secret --'
  export FB_ACCESS_TOKEN='-- your access token here --'
  ```

- Run the script with
  ```
  node index.js
  ```

## Facebook Requirements

- Access Token
  You can generate one from here (https://developers.facebook.com/tools/explorer/).

- Extended permissions *you will need* to put in the token generator:
  ```
  manage_pages
  publish_actions
  ```

## Credits
- Hans Doller <hans.doller@hookupjs.com>
  Some code was borrowed from Thuzi's facebook-node-sdk project (https://github.com/Thuzi/facebook-node-sdk)