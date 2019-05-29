# scte35-js

Support for SCTE35 parsing in either NodeJS or a "modern" browser.

# Demo

Visit https://comcast.github.io/scte35-js/ and paste the following in the text box and hit the `Parse` button:

`/DBGAAET8J+pAP/wBQb+AAAAAAAwAi5DVUVJQAErgX+/CR9TSUdOQUw6OGlTdzllUWlGVndBQUFBQUFBQUJCQT09NwMDaJ6RZQ==`

In order to deploy changes to the demo read the README found at https://github.com/Comcast/scte35-js/tree/master/ui.

# Import

    // See ISCTE35 for methods & ISpliceInfoSection for results.
    import { SCTE35 } from "scte35";

or...

    const SCTE35 = require("scte35").SCTE35;

then...

    const result = SCTE35.parseFromB64("<base64 string>");

# CLI

Currently supported via the source

    npm run parse "/DBGAAET8J+pAP/wBQb+AAAAAAAwAi5DVUVJQAErgX+/CR9TSUdOQUw6OGlTdzllUWlGVndBQUFBQUFBQUJCQT09NwMDaJ6RZQ=="


## TODO:
- Turn these TODO's into tickets
- Support for additional splice descriptors
- Documentation on the methods and interfaces (jsdoc)
- Published docs (in GH wiki maybe?)
- Command line tool to run from bin as part of the package install
   (i.e) `npm install -g scte35-js; scte35-cli <payload>`
- Additional testing/coverage
- TSLint the project
- Support for alignment stuffing
- Validate the CRC or ECRC
- Support for encryption
- Lint commit Angular style w/ release notes generated
- Publish to NPM
- Wire up to available CI tools
- Create a UI wrapper to host (location TBD / github pages?)
- Create awareness and advocate for this project in video communities
- Ignore util directory from test coverage
- Implement component count of the segmentation descriptor
- Track down the older specs to confirm which versions this module supports
