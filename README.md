# getset-typescript package

Generate getters and setters of private typescript members automatically.

![Example for getset-typescript](./getset.gif)

## Usage
**Select all member variables** you want to generate getters and setters for.
Simply press **Cmd+Alt+g** (or rightclick and select "*Generate Getters and Setters*") to generate the getters and setters for the selected variables below the selection.
**IMPORTANT: only private members starting with your private prefix will be considered (default prefix '_')**

## Configuration
Only variables with a specially prefixed name will be recognized for getter and setter generation. Per default, they have to start with an underscore (eg. \_name). The prefix can be configured in atom by pressing **Ctl+Shift+p**, typing **application:open-your-config**, pressing enter and adding or changing the variable **privatePrefix** as follows:

```
"*":
  [...]
  "getset-typescript":
    privatePrefix: "_"
  [...]
```
## Possibilities and limitations
If the private variable has an explicit type definition, this type will be used. If the type is implicitly defined by an assignment, the assigned type will be inferred. Have a look at the table below in order to see some examples of the type recognition and its limits.

|Member variable| Type of generated getter and setter |
|-----|-----|
|private _firstName: string;| string |
|private _greeting = \`Hello, ${_firstName}`;| string |   |   |
|private _address = new Address();| Address |
|private _pregnant = true;| boolean |
|private _number = .213;| number |  
|private _func: () => void = () => console.log('hey');   | () => void |
|private _func2 = () => console.log('hey');   | any  |
|private _obj: { age: number };   | any   |  
|private _someval = SOME_CONST_VALUE;| any |
|private _fromFunc = getInstance();| any |

### Changelog
[See here](./CHANGELOG.md)
