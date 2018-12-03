"use strict";

// Subshell test

const kiwi = require("../main.js");

function logEval(input) {
	const results = function(str) {
		try {
			str = eval.call(this, str);
		} catch (e) {
			str = e.stack;
		}
		return str;
	}.call(this.state, input);
	console.log(results);
}

async function parseCommand(input) {
	const args = input.split(" ");
	const cmd = args.shift().trim();
	const operation = this.fetch(cmd);
	if (!operation) return this.noOp(cmd);
	const err = await operation.run(this, args);
	if (err) {
		this.e(err);
	} else {
		this.prompt();
	}
}

function parser(input) {

	// Listen for SetEnv Command, which is active in all Environments
	if (input.trim().startsWith("setenv"))
		parseCommand.call(this, input);
	else {
		switch(this.env[this.curEnv]) {

			// Command Environment
			case 0: parseCommand.call(this, input); break;

			// Echo Input
			case 1: console.log(input); this.prompt(); break;

			// Eval
			case 2: logEval.call(this, input); this.prompt(); break;

			// Default Case
			default: this.e(`Current Environment not supported in ${this.appname} shell.`);
		}
	}
}

const shell0 = {
	env: [0],
	envNames: ["Sub Shell"],
	commands: {
		test: function() {
			console.log("subshell test function successfully called");
			return false;
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

console.log(`Kiwi Simple CLI test. Commands: ${Object.keys(shellData.commands)}`);
kiwi("", shell1);