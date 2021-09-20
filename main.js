"use strict";

const chalk = require("chalk");
const readline = require("readline");
process.stdin.setEncoding("utf8");

class Operation {
    constructor(id, method) {
        this.id = id;
        this.method = method;
    }

    async run(shellCtx, args) {
        return new Promise(async (resolve, reject) => {
            let results;
            try {
                results = await this.method.call(shellCtx, ...args);
            } catch (e) {
                results = e.stack;
            }
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
        this.parser = shellData.parser || Shell.defaultParser;
        this.env = shellData.env || [0];
        this.curEnv = 0; // Default to the first environment
        this.envNames = shellData.envNames || [this.appname];
        this.commands = this.env.indexOf(0) !== -1 && shellData.commands ? shellData.commands : {};
        this.state = shellData.state || {}; // Parser and Command mutable state

        // Add default control commands if they don't exist
        if (!this.commands.help) Object.assign(this.commands, {
            help: () => console.log(`Kiwi-CLI help\nThis is the default help command- consider adding your own with more detailed output.\nCommand List: ${Object.keys(this.commands).join(", ")}`)
        });
        if (!this.commands.exit) Object.assign(this.commands, {
            exit: () => {
                console.log("Thank you for trying Kiwi-CLI!");
                this.exit();
            }
        });
        
        // Error Handler
        this.e = e;

        // Connect CLI
        this._initialize();
    }
    
    _initialize() {
        this.cli = readline.createInterface({
            input: this.stdin,
            output: this.stdout,
            completer: this._completer.bind(this),
            historySize: 100,
            prompt: `[${this.envNames[this.curEnv]}]$ `,
            removeHistoryDuplicates: true
        });
        this.cli.on("SIGINT", () => process.exit());
        this.cli.on("SIGCONT", () => this.prompt());
        this.cli.on("line", (input) => this._receive(input));
    }

    _matcher(str, set) {
        if (set.indexOf(str) > -1) return null;

        function toId(str) {
            return String(str).toLowerCase().replace(/[^a-z0-9]+/g, "");
        }
        
        // Early match
        for (let i = 0; i < set.length; i++)
            if (set[i].startsWith(toId(str))) return set[i];
        
        // Determine sensitivity to use based on string length
        let d = 0;
        const R = [2, 4, 6, 8];
        for (d; d < R.length; d++)
            if (str.length <= R[d]) break;

        // Lev algorithm
        function calc(s, t, l) {
            let d = [];
            let n = s.length;
            let m = t.length;
            let s_i, t_j, cost, mi, b, c;
            if (n === 0) return m;
            if (m === 0) return n;
            if (l && Math.abs(m - n) > l) return Math.abs(m - n);
            for (let i = n; i >= 0; i--) d[i] = [];
            for (let i = n; i >= 0; i--) d[i][0] = i;
            for (let j = m; j >= 0; j--) d[0][j] = j;
            for (let i = 1; i <= n; i++) {
                s_i = s.charAt(i - 1);
                for (let j = 1; j <= m; j++) {
                    if (i === j && d[i][j] > 4) return n;
                    t_j = t.charAt(j - 1);
                    cost = (s_i === t_j) ? 0 : 1;
                    mi = d[i - 1][j] + 1;
                    b = d[i][j - 1] + 1;
                    c = d[i - 1][j - 1] + cost;
                    if (b < mi) mi = b;
                    if (c < mi) mi = c;
                    d[i][j] = mi;
                }
            }
            return d[n][m];
        }

        for (const i of set)
            if (calc(toId(str), i, d) <= d) return [i];

        return null;
    }

    _completer(input) {
        const match = this._matcher(input, Object.getOwnPropertyNames(this.commands));
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

    _fetch(id) {
        id = id.trim();
        if (!this.commands[id]) return null;
        return new Operation(id, this.commands[id]);
    }

    _noOp(cmd) {
        console.log(chalk.red.bold("--Invalid Command: " + cmd + " - type `help` for a list of commands."));
        this.prompt();
    }

    _receive(input) {
        if (this.paused) return;
        if (this.subshell)
            this.subshell._receive(input);
        else
            this.parser(input);
    }
    
    // Public methods
    shell(appname, shellData, stdin, stdout) {
        this.cli.close();
        this.paused = true;
        this.subshell = new Shell(appname, this, shellData, stdin || this.stdin, stdout || this.stdout);
        return this.subshell;
    }
    
    prompt() {
        if (this.exited)
            return;
        if (this.subshell && this.paused)
            this.subshell.prompt();
        else
            this.cli.prompt(true);
    }

    getTopShell() {
        return this.master ? this.master.getTopShell() : this;
    }

    getBottomShell() {
        return this.subshell ? this.subshell.getBottomShell() : this;
    }

    parse(input) {
        this.parser.call(this, input);
    }
    
    parseCommand(input) {
        Shell.defaultParser.call(this, input);
    }

    exit() {
        this.cli.close();
        this.exited = true;
        if (this.master) {
            this.master._initialize();
            this.master.paused = false;
            this.master.subshell = null;
            this.master.prompt();
        }
    }
    
    static async defaultParser(input) {
        const args = input.split(" ");
        const cmd = args.shift().trim();
        const operation = this._fetch(cmd);
        if (!operation) return this._noOp(cmd);
        const err = await operation.run(this, args);
        if (err)
            this.e(err);
        this.prompt();
    }
};

function init(appname, shellData, e = e => console.error(e), prompt = true, stdin = process.stdin, stdout = process.stdout) {
    const shell = new Shell(appname, null, shellData, stdin, stdout, e);
    if (prompt) shell.prompt();
    return shell;
}

module.exports = init;

if (require.main === module) {
    console.log("This module is not meant to run by itself.");
    console.log("Try using const kiwi = require(\"kiwi-cli\"); to use this in your project.");
}