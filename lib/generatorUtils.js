
module.exports = {
  extractVarName(str) {
    return getPartBetween(str, '_', [':', ';', '\n', ' ', '=']);
  },

  extractType(str) {
    // check for direct type assignment using the ':' operator
    let type = getPartBetween(str, ':', [' ', ';', '\n', '=']);
    // try if it is an implicit type (eg. const s = new Object())
    if(!type || type.length === 0) {
      type = getPartBetween(str, 'new ', [' ', '(', ';', '\n'])
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
  const firstPart = str.substr(indexOfStart + startPattern.length, str.length).trim();

  let possibleEndsArraySeparatorIndex = firstPart.length;
  possibleEndsArray.forEach(end => {
    const index = firstPart.indexOf(end);
    possibleEndsArraySeparatorIndex = index !== -1 && index < possibleEndsArraySeparatorIndex ? index : possibleEndsArraySeparatorIndex;
  });

  return firstPart.substr(0, possibleEndsArraySeparatorIndex).trim();
}
