![ANSI/SCTE-35 JS](assets/scte35-logo.png)

<h2 align="center">ANSI/SCTE35 JS PARSER</h2>

SCTE35 tools for parsing in CLI using NodeJS or in a "modern" browser.

## Development

Install the root package dependencies before working on the parser or CLI:

```bash
npm install
```

Useful root scripts:

```bash
npm test       # run the TypeScript unit tests
npm run lint   # lint the root project
npm run build  # clean and compile src/ into build/
npm run docs   # regenerate TypeDoc output in jsdoc/
npm run cover  # run tests with nyc coverage
```

The Angular demo in `ui/` has its own `package.json` and release flow. Root dependency updates and npm package releases should not require changes under `ui/` unless the demo itself is changing.

## Release

The npm package publishes a small allowlisted set of files: compiled output from `build/`, generated type declarations, CLI scripts, package metadata, license/notice files, the README, and assets used by the README. Make releases from a clean branch after validating the root project:

```bash
npm install
npm test
npm run lint
npm run build
npm run docs
npm audit
```

Commit the version bump and regenerated `jsdoc/` output before merging the release branch. The publish step does not regenerate docs.

Update the package version with `npm version patch`, `npm version minor`, or `npm version major`, then inspect the package before publishing:

```bash
npm pack --dry-run
npm publish --dry-run
```

When the dry-run looks right, publish from the root directory:

```bash
npm publish
```

The publish lifecycle runs `prepublishOnly` first, which executes `npm run build`. After publishing, `postpublish` runs `npm run clean`, removing the generated `build/` directory from the working tree.

## Demo

Visit https://comcast.github.io/scte35-js/ and paste the following in the text box and hit the `Parse` button:

`/DBGAAET8J+pAP/wBQb+AAAAAAAwAi5DVUVJQAErgX+/CR9TSUdOQUw6OGlTdzllUWlGVndBQUFBQUFBQUJCQT09NwMDaJ6RZQ==`

In order to deploy changes to the demo read the README found at https://github.com/Comcast/scte35-js/tree/master/ui.

## SCTE35 Module

    // See ISCTE35 for methods & ISpliceInfoSection for results.

```typescript
    import { SCTE35 } from "scte35";
    const scte35: SCTE35 = new SCTE35();
    const result = scte35.parseFromB64("<base64 string>");
```

## CLI

The parser can be executed from the bin by first installing it globally and then executing the `scte35` command:

```bash
    npm i scte35 -g
    scte35
    > ? Please provide the SCTE-35 tag that you would like to parse
```

Parsing defaults to base 64, however hexadecimal can easily be parsed as well using the `--hex` flag

```bash

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

```bash
    npm i -g fx
    scte35 /DBGAAET8J+pAP/wBQb+AAAAAAAwAi5DVUVJQAErgX+/CR9TSUdOQUw6OGlTdzllUWlGVndBQUFBQUFBQUJCQT09NwMDaJ6RZQ== | fx
```
