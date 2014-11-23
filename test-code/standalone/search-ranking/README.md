## Installation
- Extract archive and install node dependencies using `npm install`.

- Set the following environment variables:
  ```bash
  export MONGO_URI='mongodb://your-host/your-db-name'
  export GOOGLE_CSE_CX='-- your google cx id --'
  export GOOGLE_CSE_KEY='-- your google cse key --'
  ```

- Run the script with
  ```bash
  node index.js
  ```
## Usage Screen
```
  Usage: node index.js [action] [opts]

-- Global Options --

  -h|--help             show this screen
  -v|--verbose          enable verbose output

-- Available Actions --

  fetch
    -C <str>            Google CX key to use (default: "-- invalid key --")
    -K <str>            Google API key to use (default: "-- invalid key --")
    -n <int>            number of pages to fetch (default: 1)
    -p <int>            number of results per page (default: 10)
    -d|--date=<str>     fetch data for keywords that have not been fetched since
                        before this date.
    -i|--import         import keywords that are not in the database already
                        (otherwise they will be skipped)
    -t|--tag=<str>      when combined with import, applies tag to all keywords
                        matched. If import is not provided, ignores --keyword and --file,
                        and only fetches for keywords tagged with tag. This can work
                        combined with --date option as well.
    -k|--keyword=<str>  fetch ranking results for a single keyword
    -f|--file=<file>    fetch ranking results for a list of keywords in a file

  flush
    --all               flush all data
    --keywords          flush keywords only
    --checks            flush keyword check results only
    -t|--tag=<str>      filters flushing (--keywords|--checks) to keywords
                        tagged with tag only.
    -o|--only-tag       works combined with -t|--tag, will flush the keyword if it
                        only has the one tag searched for. If multiple tags exists,
                        it will remove only the tag for the keyword.

  list
    -a|--all            show all the keywords in the system
    -q|--query=<str>    show all keywords that meet the match criteria
    -t|--tag=<str>      show all keywords that are tagged with tag.
    -c|--csv            display list in CSV format
    -r|--results        show latest stored results for listed keywords
    -T|--title          show title of the result (depends on -r|--results)
    -s|--snippet        show snippet of the result (depends on -r|--results)
```

## Example usage

#### Fetch ranking for certain keywords, and import keywords into database:
  ```bash
  node index.js fetch --keyword 'your keyword here' --import
  ```

#### Fetch ranking for a file with keywords, and tag keywords as "something":
  ```bash
  node index.js fetch --file '/path/to/keywords.txt' --tag="something" --import --verbose
  ```

#### Fetch ranking for keywords which haven't been run in 2 weeks:
  ```bash
  node index.js fetch --date 'last 2 weeks'
  ```

  *Note*, The date can be a regular JS compatible date as well as a relative "smart" date.
  Valid smart dates are formatted as the following:

  `(last|next) ## (minutes|hours|days|weeks|months|years)`

#### List all keywords in the database in CSV format
  ```bash
  node index.js list --all --csv
  ```

#### List keywords in the database that match a regular expression and show the latest stored results (including title -t and snippet -s)
  ```bash
  node index.js list --query="^something" -rst
  ```

#### List keywords in database that are tagged with "something"
  ```bash
  node index.js list --tag="something"
  ```

#### Flush all data in the db (keywords, and check data)
  ```bash
  node index.js flush --all
  ```

#### Flush all data check data only in the db
  ```bash
  node index.js flush --checks
  ```

#### Flush keywords for a specific tag
  ```bash
  node index.js flush --tag="something" --keywords --verbose
  ```

#### Flush keywords that ONLY have this tag
  ```bash
  node index.js flush --tag="something" -o --keywords --verbose
  ```

## Google Requirements

- CSE CX & API Key
  You can generate one from here (https://www.google.com/cse/create/new).

- CSE Whitelist IP (for dev and production machines).
  Google requires each machine accessing the API key will need to be authorized from the Google backend.

## Credits
- Hans Doller <hans.doller@hookupjs.com>
- Jeremy Goodrich <jeremy.goodrich@hookupjs.com>