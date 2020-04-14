import arg from "arg";
import inquirer from "inquirer";
import { SCTE35 } from "../build/scte35";

const version = require("../package.json").version;
const scte35 = new SCTE35();

function parseArgumentsIntoOptions(rawArgs) {
    const args = arg(
        {
            "--help": Boolean,
            "--hex": Boolean,
            "--version": Boolean,
            "-h": "--help",
            "-v": "--version",
        },
        {
            argv: rawArgs.slice(2),
        }
    );
    return {
        help: args["--help"] || false,
        hex: args["--hex"] || false,
        input: args._[0],
        version: args["--version"] || false,
    };
}

async function promptForMissingOptions(options) {
    const questions = [];
    if (!options.input) {
        questions.push({
            type: "input",
            name: "input",
            message: "Please provide the SCTE-35 tag that you would like to parse",
        });
    }
    const answers = await inquirer.prompt(questions);
    return {
        format: options.hex ? "Hexadecimal" : "Base64",
        input: options.input || answers.input,
    };
}

export async function cli(args) {
    let options = parseArgumentsIntoOptions(args);
    if (options.help) {
        console.log("Useage: scte35 [options] [arguments]\n");
        console.log("Examples:\n");
        console.log(
            "\tscte35 --hex fc3046000113f09fa900fff00506fe000000000030022e4355454940012b817fbf091f5349474e414c3a386953773965516946567741414141414141414242413d3d370303689e9165\n"
        );
        console.log(
            "\tscte35 /DBGAAET8J+pAP/wBQb+AAAAAAAwAi5DVUVJQAErgX+/CR9TSUdOQUw6OGlTdzllUWlGVndBQUFBQUFBQUJCQT09NwMDaJ6RZQ==\n"
        );
        console.table([
            { Option: "--help, -h", Description: "print node command line options (currently set)" },
            { Option: "--hex", Description: "evaluate using hexadecimal scte35 input" },
            { Option: "--version, -v", Description: "print SCTE35.js version" },
        ]);
        console.log("\nDocumentation can be found at https://github.com/Comcast/scte35-js");
        return;
    }
    if (options.version) {
        console.log(version);
        return;
    }
    console.log(options);
    options = await promptForMissingOptions(options);
    let output;
    if (options.format == "Base64") {
        output = JSON.stringify(scte35.parseFromB64(options.input), null, 4);
    }
    if (options.format == "Hexadecimal") {
        output = JSON.stringify(scte35.parseFromHex(options.input), null, 4);
    }
    console.log(output);
}
