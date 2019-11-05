# scte35-js

Support for SCTE35 parsing in either NodeJS or a "modern" browser.

## Demo

Visit https://comcast.github.io/scte35-js/ and paste the following in the text box and hit the `Parse` button:

`/DBGAAET8J+pAP/wBQb+AAAAAAAwAi5DVUVJQAErgX+/CR9TSUdOQUw6OGlTdzllUWlGVndBQUFBQUFBQUJCQT09NwMDaJ6RZQ==`

In order to deploy changes to the demo read the README found at https://github.com/Comcast/scte35-js/tree/master/ui.

## SCTE35 Module

    // See ISCTE35 for methods & ISpliceInfoSection for results.

```typescript
    import { SCTE35 } from "scte35";
```

or...

```typescript
    const SCTE35 = require("scte35").SCTE35;
```

then...

```typescript
    const result = SCTE35.parseFromB64("<base64 string>");
```

## CLI

The parser can be executed from the bin by first installing it globally and then executing the `scte35` command:

```terminal
    npm i scte35 -g
    scte35
    > ? Please provide the SCTE-35 tag that you would like to parse
```

Parsing defaults to base 64, however hexadecimal can easily be parsed as well using the `--hex` flag

```terminal

    #default base64
    scte35 /DBGAAET8J+pAP/wBQb+AAAAAAAwAi5DVUVJQAErgX+/CR9TSUdOQUw6OGlTdzllUWlGVndBQUFBQUFBQUJCQT09NwMDaJ6RZQ==

    #hexadecimal
    scte35 --hex fc3046000113f09fa900fff00506fe000000000030022e4355454940012b817fbf091f5349474e414c3a386953773965516946567741414141414141414242413d3d370303689e9165

    #both will output the formatted JSON
    > {
        "tableId": 252,
        "selectionSyntaxIndicator": false,
        "privateIndicator": false,
        ...
    }
```

### Piping

The parser output can be piped into other tools, such as a JSON display utility like `fx` in order to visualize the JSON object and interact with it.

```terminal
    npm i -g fx
    scte35 /DBGAAET8J+pAP/wBQb+AAAAAAAwAi5DVUVJQAErgX+/CR9TSUdOQUw6OGlTdzllUWlGVndBQUFBQUFBQUJCQT09NwMDaJ6RZQ== | fx
```

## TODO

- Turn these TODO's into tickets
- Support for additional splice descriptors
- Documentation on the methods and interfaces (jsdoc)
- Published docs (in GH wiki maybe?)
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
