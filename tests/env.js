"use strict";

// Environments Test

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

const shellData = {
	env: [0, 1, 2],
	envNames: ["CLI Environment", "Echo Console", "> "],
	commands: {
		setenv: function(mode) {
			const env = parseInt(mode);
			if (this.env.indexOf(env) === -1) return "Invalid Environment, valid options: " + this.env.join(", ");
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

kiwi("", shellData);