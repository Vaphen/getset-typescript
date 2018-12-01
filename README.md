# getset-typescript package

Generate getters and setters of private typescript members automatically.

![Example for getset-typescript](./getset.gif)

## Usage
Select all member variables you want to generate getters and setters for.
Simply press **Cmd+Alt+g** to generate the getters and setters below the selected variables.

|Hints|
|-----|
|Private members must start with an underscore ('_'). |

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
