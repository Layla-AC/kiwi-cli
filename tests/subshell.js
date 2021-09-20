"use strict";

// Subshell test

const kiwi = require("../main.js");

const shell0 = {
    env: [0],
    envNames: ["Sub Shell"],
    commands: {
        test: function() {
            console.log("Subshell test command successfully called.");
            return false;
        },
        exit: function() {
            console.log("Returning to Main Shell.");
            this.exit();
        }
    }
};

const shell1 = {
    env: [0],
    envNames: ["Main Shell"],
    commands: {
        launchShell: function() {
            this.shell("", shell0);
        }
    }
};

console.log(`Kiwi Simple CLI test. Commands: ${Object.keys(shell1.commands)}`);
kiwi("", shell1);