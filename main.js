"use strict";
const chalk = require("chalk");
const readline = require("readline");
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

class Shell {
	constructor(appname, master, shellData, stdin, stdout, e) {
		this.appname = appname;
		this.master = master;
		this.stdin = stdin;
		this.stdout = stdout;
		this.subshell = null;
		this.commands = null;
		this.paused = false;
		this.exited = false;

		// Initialize Shell
		this.parser = shellData.parser || defaultParser;
		this.env = shellData.env || [0];
		this.curEnv = 0; // Default to the first environment
		this.envNames = shellData.envNames || [this.appname];
		this.commands = this.env.indexOf(0) !== -1 && shellData.commands ? shellData.commands : {};
		this.state = shellData.state || {}; // Parser and Command mutable state

		if (!this.commands.help) Object.assign(this.commands, { help: () => console.log(`Command List: ${Object.keys(this.commands)}`) });
		if (!this.commands.exit) Object.assign(this.commands, { exit: () => this.exit() });

		this.cli = readline.createInterface({
			input: stdin,
			output: stdout,
			completer: this.completer,
			historySize: 100,
			prompt: `[${this.envNames[this.curEnv]}]$ `,
			removeHistoryDuplicates: true
		});
		this.cli.on("SIGINT", () => process.exit());
		this.cli.on("SIGCONT", () => this.prompt());
		this.cli.on("line", (input) => this.receive(input));

		this.e = e;
	}

	matcher(str, set) {
		if (set.indexOf(str) > -1) return null;

		function toId(str) {
			return String(str).toLowerCase().replace(/[^a-z0-9]+/g, "");
		}

		for (let i = 0; i < set.length; i++) {
			if (set[i].startsWith(toId(str))) return set[i];
		}
		let d = 0;
		const R = [2, 4, 6, 8];
		for (d; d < R.length; d++) {
			if (str.length <= R[d]) break;
		}

		function calc(s, t, l) {
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
			if (calc(toId(str), i, d) <= d) return [i];
		}
		return null;
	}

	completer(input) {
		const match = this.matcher(input, Object.getOwnPropertyNames(this.commands));
		if (!match) {
			return [[], input];
		} else if (typeof match === "string") {
			return [[match], input];
		} else if (typeof match === "object") {
			this.cli.write(null, {ctrl: true, name: 'u'});
			this.cli.write(match[0]);
			return [];
		}
	}

	prompt() {
		if (this.exited)
			return;
		else if (this.subshell)
			this.subshell.prompt();
		else
			this.cli.prompt(true);
	}

	fetch(id) {
		id = id.trim();
		if (this.commands[id]) return new Operation(id, this.commands[id]);
		return null;
	}

	noOp(cmd) {
		console.log(chalk.red.bold("--Invalid Command: " + cmd + " - type `help` for a list of commands."));
		this.prompt();
	}

	shell(appname, shellData, stdout) {
		this.cli.pause();
		this.paused = true;
		this.subshell = new Shell(appname, this, shellData, this.stdin, stdout || this.stdout);
		return this.subshell;
	}

	receive(input) {
		if (this.paused) return;
		if (this.subshell)
			this.subshell.receive(input);
		else
			this.parser(input);
	}

	getTop() {
		return this.master ? this.master.getTop() : this;
	}

	getBottom() {
		return this.subshell ? this.subshell.getBottom() : this;
	}

	parse(input) {
		this.parser.call(this, input);
	}

	exit() {
		this.cli.close();
		this.exited = true;
		if (this.master) {
			this.master.cli.resume();
			this.master.paused = false;
			this.master.subshell = null;
			this.master.prompt();
		}
	}
};

async function defaultParser(input) {
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

function init(appname, shellData, e = (e) => console.log(e), prompt = true, stdin = process.stdin, stdout = process.stdout) {
	const shell = new Shell(appname, null, shellData, stdin, stdout, e);
	if (prompt) shell.prompt();
	return shell;
}

module.exports = init;