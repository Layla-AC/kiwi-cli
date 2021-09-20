"use strict";

const kiwi = require("../main.js");

const shellData = {
    env: [0],
    envNames: ["CLI Environment"],
    state: { count: 0 },
    commands: {
        incrementState: function() {
            this.count++;
            console.log("Counter incremented.");
            return false;
        },
        resetState: function() {
            this.count = 0;
            console.log("Counter reset.");
            return false;
        },
        outputState: function() {
            console.log(`state.count = ${this.count}`);
            return false;
        }
    }
};

console.log("Kiwi CLI state test.");
kiwi("", shellData);