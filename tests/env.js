"use strict";

// Environments Test

const kiwi = require("../main.js");
const chalk = require("chalk");

function logEval(input) {
    const results = function(str) {
        let out;
        try {
            out = eval(str);
        } catch (e) {
            out = chalk.red.bold(e.stack);
        }
        return out;
    }.call(this.state, input);
    console.log(results);
}

function parser(input) {

    // Listen for SetEnv Command, which is active in all Environments
    if (input.trim().startsWith("setenv"))
        this.parseCommand.call(this, input);
    else {
        switch(this.env[this.curEnv]) {

            // Command Environment
            case 0: this.parseCommand.call(this, input); break;

            // Echo Input
            case 1: console.log(input); this.prompt(); break;

            // Eval
            case 2: logEval.call(this, input); this.prompt(); break;

            // Default Case
            default: this.e(`Current Environment not supported in ${this.appname} shell.`);
        }
    }
}

const shellData = {
    env: [0, 1, 2],
    envNames: ["CLI Environment", "Echo Console", "Eval"],
    commands: {
        setenv: function(mode) {
            let env = parseInt(mode);
            if (this.env.indexOf(env) === -1)
                return "Invalid Environment, valid options: " + this.env.join(", ");
            this.curEnv = env;
            this.cli.setPrompt(`[${this.envNames[this.curEnv]}]$ `);
            return false;
        },

        test: function(...args) {
            console.log(`Test Command successful. ${args ? `Args: ${args && args.length && args.length !== 0}` : "No Arguments provided."}`);
            return false;
        }
    },
    parser: parser
};

console.log(`Kiwi Environment mode test.\nModes: 0 - CLI Mode,\n1 - Echo Mode,\n2 - Eval Mode\nCommands: ${Object.keys(shellData.commands)}`);
kiwi("", shellData);