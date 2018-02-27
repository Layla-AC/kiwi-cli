"use strict";
const chalk = require("chalk");
process.stdin.setEncoding("utf8");

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
		this.cli = require("readline").createInterface({
			input: process.stdin,
			output: process.stdout,
			completer: this.completer,
			terminal: true,
			historySize: 100,
			prompt: `[${this.appname}]$`,
			removeHistoryDuplicates: true
		});
		this.cli.on("SIGINT",() => {process.exit();});
		this.cli.on("SIGCONT",() => {this.prompt()});
	}
	
	prompt() { this.cli.prompt(); }
	
	fetch(id) {
		id = id.trim();
		if (this.commands[id]) return new Operation(id, this.commands[id]);
		return null;
	},
	
	matcher(str,set) {
		if (set.indexOf(str) > -1) return null;
		function toId(str) { return String(str).toLowerCase().replace(/[^a-z0-9]+/g, ""); }
		for (let i = 0; i < set.length; i++) {
			if (set[i].startsWith(toId(str))) return set[i];
		}
		let d = 0;
		const R = [2,4,6,8];
		for (d; d < R.length; d++) {
			if (str.length <= R[d]) break;
		}
		function calc(s,t,l) {
			let d = [];
			let n = s.length;
			let m = t.length;
			if (n === 0) return m;
			if (m === 0) return n;
			if (l && Math.abs(m - n) > l) return Math.abs(m - n);
			for (let i = n; i >= 0; i--) d[i] = [];
			for (let i = n; i >= 0; i--) d[i][0] = i;
			for (let j = m; j >= 0; j--) d[0][j] = j;
			for (let i = 1; i <= n; i++) {
				let s_i = s.charAt(i - 1);
				for (let j = 1; j <= m; j++) {
					if (i === j && d[i][j] > 4) return n;
					let t_j = t.charAt(j - 1);
					let cost = (s_i === t_j) ? 0 : 1;
					let mi = d[i - 1][j] + 1;
					let b = d[i][j - 1] + 1;
					let c = d[i - 1][j - 1] + cost;
					if (b < mi) mi = b;
					if (c < mi) mi = c;
					d[i][j] = mi;
				}
			}
			return d[n][m];
		}
		for (const i of set) {
			if (calc(toId(str),i,d) <= d) return [i];
		}
		return null;
	}
	
	completer(input) {
		const match = this.matcher(input,Object.getOwnPropertyNames(this.commands));
		if (!match) {
			return [[],input];
		} else if (typeof match === "string") {
			return [[match],input];
		} else if (typeof match === "object") {
			this.cli.write(null,{ctrl:true,name:'u'});
			this.cli.write(match[0]);
			return [];
		}
	}

	noOp(cmd) {
		console.log(chalk.red.bold("--Invalid Command: " + cmd + " - type `help` for a list of commands."));
		this.prompt();
	}
};

function init(appname, commands, e) {
	const Manager = new CLI_MANAGER(appname, commands);
	Manager.prompt();
	Manager.cli.on("line", async function(input) {
		const args = input.split(",");
		const cmd = args.shift().trim();
		const operation = Manager.fetch(cmd);
		if (!operation) return Manager.noOp(cmd);
		const err = await operation.run(this, args);
		if (err) {
			e(err);
		} else {
			Manager.prompt();
		}
	}.bind(this));
	return Manager.prompt;
}

module.exports = init;