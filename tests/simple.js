"use strict";

// Basic CLI Test

const kiwi = require("../main.js");

const shellData = {
	commands: {
		test1: function() {
			console.log("Test Command 1 successful.");
			return false;
		},

		test2: function(...args) {
			console.log(`Test Command 2 successful. ${args ? `Args: ${args && args.length && args.length !== 0}` : "No Arguments provided."}`);
			return false;
		},

		exit: function() {
			process.exit();
		}
	}
};

console.log(`Kiwi Simple CLI test. Commands: ${Object.keys(shellData.commands)}`);
kiwi("Test CLI", shellData);