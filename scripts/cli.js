import arg from 'arg';
import inquirer from 'inquirer';
import {
    SCTE35
} from "../build/lib/scte35";

//TODO: implement --help and --h flags that describe these arguments
function parseArgumentsIntoOptions(rawArgs) {
    const args = arg({
        '--hex': Boolean
    }, {
        argv: rawArgs.slice(2),
    });
    return {
        hex: args['--hex'] || false,
        input: args._[0]
    };
}

async function promptForMissingOptions(options) {
    const questions = [];
    if (!options.input) {
        questions.push({
            type: 'input',
            name: 'input',
            message: 'Please provide the SCTE-35 tag that you would like to parse'
        });
    }
    const answers = await inquirer.prompt(questions);
    return {
        format: options.hex ? 'Hexadecimal' : 'Base64',
        input: options.input || answers.input
    };
}

export async function cli(args) {
    let options = parseArgumentsIntoOptions(args);
    options = await promptForMissingOptions(options);
    let output;
    if (options.format == 'Base64') {
        output = JSON.stringify(SCTE35.parseFromB64(options.input), null, 4);
    }
    if (options.format == 'Hexadecimal') {
        output = JSON.stringify(SCTE35.parseFromHex(options.input), null, 4);
    }
        console.log(output);
}
