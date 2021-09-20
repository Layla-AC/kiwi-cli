# Kiwi-CLI

Node.js CLI that allows for the developer to include any arbitrary list of commands to be made usable in a customizable CLI.

New Features:
* Nestable CLI shells with unique parser and command objects.
* Multiple Environments per shell allowing for more complex parser functions.
* Persistent state object in scope of the parser and all commands loaded into a shell. Must be bound in shell data.

4 usage examples can be found in the tests directory of this library.

### Guide

#### Basic Usage

Kiwi-CLI can be used as simply as calling the function exported by ``require("kiwi-cli");``.
This function accepts up to 6 arguments:
* String appname - Default name for prompter and environment in the Shell.
* Object shellData - Object defining commands and runtime parameters for the shell. More information on shellData provided below.
* function e - Optional error handler to be used in function context.
* Boolean prompt - Flag controlling whether to show a prompter. Defaults to true.
* stream.Readable input - Input stream for Shell. Defaults to process.stdin.
* stream.Writable output - Output stream for Shell. Defaults to process.stdout.

After calling this function, the spawned Shell object is returned. The shell provides the following public methods:
* shell(String appname, Object shellData, stream.Readable input = this.stdin, streamWritable output = this.stdout)
* prompt() - Display Prompter.
* getTopShell() - Return the top level shell.
* getBottomShell() - Return the bottom level shell.
* parse(String input) - Parse an arbitrary string as input in the shell.
* exit() - Close out of the shell. If this is a subshell, the master of this shell will be resumed.

Calling the shell method allows for spawning a nested sub-shell with different runtime parameters.

The following data members are also available:
* appname - String containing the default Environment and prompter name.
* master - If the current shell is a subshell, this points to the next shell in the hierarchy.
* subshell - If the current shell has a subshell, this points to the next shell under it in the hierarchy.
* state - The current state object, defaults to {} or can be bound with shellData.
* commands - An object containing the command functions loaded in this Shell.
* curEnv - Integer controlling which Environment is currently active- Defaults to 0.

#### ShellData

shellData offers the following:
* env - TODO
* envNames - TODO
* commands - TODO, make sure to mention help and exit commands
* parser - TODO
* state - TODO

If you have any questions or concerns, you can reach me at layla96c@gmail.com