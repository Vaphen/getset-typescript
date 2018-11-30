
module.exports = {
  extractVarName(str) {
    return getPartBetween(str.trimAll(), '_', [':', ';', '\n', '=']);
  },

  extractType(str) {
    const booleanIDs = ['true', 'false'];
    const stringIDs = ['\'', '\`', '\"'];
    const anyIDs = ['any', 'undefined', 'null'];
    const objectIDs = ['{'];
    const symbolIDs = ['Symbol' | 'symbol'];
    const functionIDs = ['('];
    const classIDs = ['new'];
    const numberIDs = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.'];


    const trimmedStr = str.trimAll();
    let type = '';
    // type definition is a lambda signature
    if(trimmedStr.indexOf(':') > 0 && trimmedStr.indexOf('=>') > 0) {
      const firstPart = getPartBetween(trimmedStr, ':', [';', '\n']);
      // find second occurence of '=' sign (that one after => which is the assignment)
      const positionOfAssignment = firstPart.indexOf('=', firstPart.indexOf('=') + 1);
      type = positionOfAssignment === -1 ? firstPart : firstPart.substr(0, positionOfAssignment);
    } else if(trimmedStr.indexOf(':') > 0 && trimmedStr.indexOf('{') === -1) {
      // check for direct type definition using the ':' operator (exclude class definitions by checking '{')
      type = getPartBetween(trimmedStr, ':', [';', '\n', '=']);
    }
    // try if it is an implicit type (eg. const s = new Object())
    if(!type || type.length === 0) {
      const assignmentPos = trimmedStr.indexOf('=');
      const valueStr = trimmedStr.substr(assignmentPos + 1, trimmedStr.length);
      let identifier;
      if(identifier = getStartingCharacterFromArray(valueStr, classIDs)) {
        type = getPartBetween(valueStr, identifier, [';', '\n', '(']);
      } else if(identifier = getStartingCharacterFromArray(valueStr, stringIDs)) {
        type = 'string';
      } else if(identifier = getStartingCharacterFromArray(valueStr, booleanIDs)) {
        type = 'boolean';
      } else if(identifier = getStartingCharacterFromArray(valueStr, anyIDs)) {
        type = 'any';
      } else if(identifier = getStartingCharacterFromArray(valueStr, objectIDs)) {
        // TODO: special case: multiline
        // TODO: return specific object like {a, b} because Object does not work.
        // type = 'Object';
      } else if(identifier = getStartingCharacterFromArray(valueStr, symbolIDs)) {
        type = 'symbol';
      } else if(identifier = getStartingCharacterFromArray(valueStr, functionIDs)) {
        // TODO: implement function
      } else if(identifier = getStartingCharacterFromArray(valueStr, numberIDs)) {
        type = 'number';
      }

    }
    return type;
  },

  generateGetterFor(varName, type = undefined) {
    return(
`\tget ${varName}()` + (type ? `: ${type}` : ``) + ` {
\t\treturn this._${varName};
\t}`
    )
  },

  generateSetterFor(varName, type = undefined) {
    return(
`\tset ${varName}(new${varName[0].toUpperCase() + varName.slice(1)}` + (type ? `: ${type}` : ``) + `) {
\t\tthis._${varName} = new${varName[0].toUpperCase() + varName.slice(1)};
\t}`
    )
  },
}

function getPartBetween(str, startPattern, possibleEndsArray) {
  const indexOfStart = str.indexOf(startPattern);
  // start character was not found
  if (indexOfStart === -1) {
    return;
  }
  const firstPart = str.substr(indexOfStart + startPattern.length, str.length);

  let possibleEndsArraySeparatorIndex = firstPart.length;
  possibleEndsArray.forEach(end => {
    const index = firstPart.indexOf(end);
    possibleEndsArraySeparatorIndex = index !== -1 && index < possibleEndsArraySeparatorIndex ? index : possibleEndsArraySeparatorIndex;
  });

  return firstPart.substr(0, possibleEndsArraySeparatorIndex);
}

function getStartingCharacterFromArray(str, arr) {
  for(const x of arr) {
    if(str.indexOf(x) === 0) {
      return x;
    }
  };
  return;
}

Object.assign(String.prototype, {
  trimAll() {
    // remove all whitespaces (spaces, tabulators and linebreaks)
    return this.replace(/\s|\t|\n/g, '');
  }
});
