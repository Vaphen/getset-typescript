
module.exports = {
  extractVarName(str, privatePrefix) {
    const privateKeyword = 'private';
    const trimmedStr = trimAll(str);
    const namePart = trimmedStr.substr(trimmedStr.indexOf(privateKeyword) + privateKeyword.length, trimmedStr.length);
    const endVariableChars = [':', ';', '\n', '='];
    const minimalEndVarCharIndex = Math.min(...endVariableChars.map(x => namePart.indexOf(x)).filter(x => x !== -1));

    // determine wheter it is a binding pattern (means deconstruction via private {x, y} = v;)
    // can't handle binding patterns, so return nothing. otherwise, typescript spec sais it must be a variable name
    if(namePart.indexOf(privatePrefix) !== 0) {
      return;
    }
    // check whether variable is a function => if '(' char is before any assignment character or
    // there is no assignment char but a '(', it is a function
    if((minimalEndVarCharIndex !== -1 && namePart.indexOf('(') !== -1 && namePart.indexOf('(') < minimalEndVarCharIndex) ||
        namePart.indexOf('(') !== -1 && minimalEndVarCharIndex === -1) {
      return;
    }
    return getPartBetween(trimmedStr, privatePrefix, endVariableChars);
  },

  extractType(str) {
    const booleanIDs = ['true', 'false'];
    const stringIDs = ['\'', '\`', '\"'];
    const anyIDs = ['any', 'undefined', 'null'];
    const objectIDs = ['{'];
    const symbolIDs = ['Symbol(', 'symbol('];
    const functionIDs = ['('];
    const classIDs = ['new'];
    const numberIDs = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.'];


    const trimmedStr = trimAll(str);
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
    // try if it is an implicit type via assignment (eg. const s = new Object())
    if(!type || type.length === 0) {
      const assignmentPos = trimmedStr.indexOf('=');
      const valueStr = trimmedStr.substr(assignmentPos + 1, trimmedStr.length);
      let identifier;
      if(identifier = getStartingCharacterFromArray(valueStr, classIDs)) {
        // identifier check oeperates on a trimmed string
        // check if it is not a function named like 'newSomething()' by checking space after 'new' keyword
        if(str.substr(str.indexOf('=') + 1, str.length).indexOf('new ') !== -1) {
          type = getPartBetween(valueStr, identifier, [';', '\n', '(']);
        }
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
        // symbol can be either starting with a capital or lower case character, so use the identifier itself
        // but strip the last bracket => only used to separate between symbol type and function named like 'symbolSomething()'
        type = identifier.substr(0, identifier.length - 1);
      } else if(identifier = getStartingCharacterFromArray(valueStr, functionIDs)) {
        // TODO: implement function
      } else if(identifier = getStartingCharacterFromArray(valueStr, numberIDs)) {
        type = 'number';
      }

    }
    return type;
  },

  generateGetterFor(varName, type, privatePrefix) {
    if(!type || type.length === 0) {
      type = 'any';
    }
    return(
`get ${varName}(): ${type} {
return this.${privatePrefix}${varName};
}`
    )
  },

  generateSetterFor(varName, type, privatePrefix) {
    if(!type || type.length === 0) {
      type = 'any';
    }
    return(
`set ${varName}(${varName}: ${type}) {
this.${privatePrefix}${varName} = ${varName};
}`
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


function trimAll(str) {
  // remove all whitespaces (spaces, tabulators and linebreaks)
  return str.replace(/\s|\t|\n/g, '');
}
