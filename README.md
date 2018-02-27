# Kiwi-CLI

Node.js CLI that allows for the developer to include any arbitrary list of commands to be made usable in a customizable CLI.

This Repository is not particularly designed to be usable at the moment - it may or may not receive active development later.

### Setup

To use Kiwi-CLI, you need to `require` the module in your code, and then call the exported function.

The startup function requires 3 parameters:
* (String) Application Name
* (Object) Commands
* (Function) Error Handler

Application name is simply the name the prompter will display when waiting for user input.

The Commands object is meant to be an object of functions that are run when various commands are used on the CLI. Each function in the object
is it's own command and will be usable as such. Arguments are passed to commands by taking the input string and splitting it along every space
between characters. It is recommended to use the spread operator if a command allows for arguments, and then iterating through the array to
parse them. Command function return values should be falsy in the case of no errors occuring- truthy values will be treated as errors and
passed to your error handler function.

The Error Handler function is a function that will be called whenever a command function returns a truthy value. The Error Handler will be called
with the truthy value being passed as a parameter to it.

### Example Usage

```
	// Include the 2 main exports
	const kiwi = require("kiwi-cli");
	
	// Get our commands object
	// This is best handled by storing them in another file
	// However, for this example I'll define them here
	// Commands are expected to return false for successful operations
	// or an error if something goes wrong
	const commands = {
		foo: function(...args) {
			if (args) {
				console.log("bar");
				return false;
			} else {
				return ("Error");
			}
		},
		
		help: function() {
			console.log("Hello World");
			return false;
		}
	};
	
	// Define our error handler
	// This is called whenever one of our commands returns a truthy value
	function catchErr(err) {
		console.log(err);
	}
	
	// We're ready to start handling input from the user
	// The initialization function will return a reference
	// To the prompt function - which usually won't be needed.
	const prompt = kiwi("My Application", commands, catchErr);
```

If you have any questions or concerns, you can reach me at trentacharles@gmail.com