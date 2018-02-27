"use strict";
const chalk = require("chalk");

class Operation {
	constructor(id, method) {
		this.id = id;
		this.method = method;
	}

	async run(ctx, args) {
		return new Promise(async (resolve, reject) => {
			const results = await this.method.call(ctx, ...args);
			resolve(results);
		});
	}
};

class CLI_MANAGER {
	constructor(appname, commands) {
		this.appname = appname;
		this.commands = commands;
	}
	
	fetch(id) {
		id = id.trim();
		if (this.commands[id]) return new Operation(id, this.commands[id]);
		return null;
	},

	noOp(cmd) {
		console.log(chalk.red.bold("--Invalid Command: " + cmd + " - type `help` for a list of commands."));
		this.prompt();
	}
	
	prompt() {
		process.stdout.write("[" + this.appname + "]$ ");
		process.stdin.resume();
	}
};

function acceptInput(appname, commands, errFunction) {
	const Manager = new CLI_MANAGER(appname, commands);
	Manager.prompt();
	process.stdin.setEncoding('utf8');
	process.stdin.on("data", async function(input) {
		const args = input.split(",");
		const cmd = args.shift().trim();
		const operation = Manager.fetch(cmd);
		if (!operation) return Manager.noOp(cmd);
		const err = await operation.run(this, args);
		if (err) {
			errFunction(err, Manager.prompt);
		} else {
			Manager.prompt();
		}
	}.bind(this));
}

exports.prompt = prompt;
exports.acceptInput = acceptInput;