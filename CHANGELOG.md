## 0.1.0 - First Release
* Added basic functionality
## 0.7.0 - F**k Version numbers
* Added type detection for basic types like string, number, boolean etc. on assignment
* Added unit test for type and variable name detection
## 1.0.0 - Auto indent incoming
* Added auto-indent after generation
* fixed some edge-case bugs
* won't generate getter or setter now if already existent
* added configuration for private variable prefix
* changed setter variable name (removed new prefix)
## 1.0.4 - Compatibility with atom-beautify
* if beautify is installed, run beautify after insertion
* only indent created getters and setters, not whole document.
## 1.0.5 - RegExp is also a type
* added RegExp type
* fixed a bug regarding nested lambda expressions
* refactored code for a better future codebase
