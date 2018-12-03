# Kiwi-CLI

Node.js CLI that allows for the developer to include any arbitrary list of commands to be made usable in a customizable CLI.

New Features:
* Nestable CLI shells with unique parser and command objects.
* Multiple Environments per shell allowing for more complex parser functions.
* Persistent state object in scope of the parser and all commands loaded into a shell.

If you used Kiwi-CLI up until now, you will need to modify your implementation for the new overhaul- backwards compatibility has not been maintained due to the extent of the rewrite. 

3 usage examples can be found in the tests directory of this library.

If you have any questions or concerns, you can reach me at trentacharles@gmail.com