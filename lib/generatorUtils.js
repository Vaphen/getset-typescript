
class TypeIdentifierTuple {
  constructor(typeName, identifierArr) {
    this.typeName = typeName;
    this.identifierArr = identifierArr;
  }
}
const typeIdentifiers = {
  booleanIDs: new TypeIdentifierTuple('boolean', ['true', 'false']),
  stringIDs: new TypeIdentifierTuple('string', ['\'', '\`', '\"']),
  anyIDs: new TypeIdentifierTuple('any', ['any', 'undefined', 'null']),
  objectIDs: new TypeIdentifierTuple('object', [/* not implemented yet */]),
  symbolIDs: new TypeIdentifierTuple('symbol', ['symbol(']),
  upperSymbolIDs: new TypeIdentifierTuple('Symbol', ['Symbol(']),
  functionIDs: new TypeIdentifierTuple('function', [/* not implemneted yet */]),
  classIDs: new TypeIdentifierTuple('class', ['new ']),
  // TODO: specs for regexp
  regexpIDs: new TypeIdentifierTuple('RegExp', ['/']),
  numberIDs: new TypeIdentifierTuple('number', ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.']),
}

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
    const definitionType = extractTypeByDefinition(str);
    if(definitionType) {
      return definitionType;
    }
    const assignmentType = extractTypeByAssignment(str);
    if(assignmentType) {
      return assignmentType;
    }
    return 'any';
  },

  generateGetterFor(varName, type, privatePrefix) {
    return(
`get ${varName}(): ${type} {
return this.${privatePrefix}${varName};
}`
    )
  },

  generateSetterFor(varName, type, privatePrefix) {
    return(
`set ${varName}(${varName}: ${type}) {
this.${privatePrefix}${varName} = ${varName};
}`
    )
  },
}

function extractTypeByAssignment(str) {
  const valueStr = str.substr(getPositionOfAssignment(str) + 1, str.length);

  for(const typeIdentifier of Object.values(typeIdentifiers)) {
    const typeStartID = getStartingCharacterFromArray(valueStr, typeIdentifier.identifierArr);
    if(typeStartID) {
      // in case it is a custom class, extract the type name from the assignment's name
      if(typeIdentifier.typeName === typeIdentifiers.classIDs.typeName) {
        return getPartBetween(valueStr, typeStartID, ['\n', ';', '(', ' ']);
      }
      return typeIdentifier.typeName;
    }
  }

  return undefined;
}

function getPositionOfAssignment(str) {
  let latestOccurance = -1;
  // iterate over lambda operators (=>) until we find a single '=' sign
  while(str.indexOf('=', latestOccurance + 1) === str.indexOf('=>', latestOccurance + 1)) {
    // reached latest occurance of equal sign then break
    if(str.indexOf('=', latestOccurance + 1) === -1) {
      break;
    }
    latestOccurance = str.indexOf('=', latestOccurance + 1);
  }
  return str.indexOf('=', latestOccurance + 1);
}

function extractTypeByDefinition(str) {
  if(containsTypeDefinition(str) && containsLambdaSignature(str)) {
      return extractLambdaDefinition(str);
  }
  if(containsTypeDefinition(str) && !containsClassIdentifier(str)) {
    return getPartBetween(trimAll(str), ':', [';', '\n', '=']);
  }
  return undefined;
}

/*
 * @param{str} the string to check for an existing anonymous class identifier
 * @return true if an identifier was found, else false
 */
function containsClassIdentifier(str) {
  return str.indexOf('{') !== -1;
}

/*
 * @param{str} the string to check for an existing type definition
 * @return true if type definition was found, else false
 */
function containsTypeDefinition(str) {
  return str.indexOf(':') !== -1;
}

/*
 * @param{str} the string to check for lambda signature (= type definition)
 * @return true if lambda type was found, else false
 */
function containsLambdaSignature(str) {
  const lambdaRegex = /.*\:.*=>.*/;
  return str.match(lambdaRegex);
}

/*
 * @param{str} string containing the lambda definition
 * @return{str} the lambda type definition between the chracters ':' and '=' (assignment, not '=>')
 */
function extractLambdaDefinition(str) {
  const trimmedStr = trimAll(str);
  const firstPart = getPartBetween(trimmedStr, ':', [';', '\n']);
  // find second occurence of '=' sign (that one after => which is the assignment)
  const positionOfAssignment = getPositionOfAssignment(firstPart);
  return positionOfAssignment === -1 ? firstPart : firstPart.substr(0, positionOfAssignment);
}

/**
 * @param{str} the string to get the part between
 * @param{startPattern} a string representing the start of the split (first occurance will be used)
 * @param{possibleEndsArray} an array of strings representing the end of the split (first occurance of any char)
 * @return a part of str between startPattern and the smallest index of possibleEndsArray in str after startPattern
 */
function getPartBetween(str, startPattern, possibleEndsArray) {
  const firstPart = str.substr(str.indexOf(startPattern) + startPattern.length, str.length);
  return firstPart.substr(0, getIndexOfFirstOccurance(firstPart, possibleEndsArray));
}

/**
 * @param{str} the string to find the first occurance in
 * @param{arr} an array containng strings
 * @return smallest index of an element from arr in str if there is any, else str.length
 */
function getIndexOfFirstOccurance(str, arr) {
  const index = Math.min(...arr.map(end => str.indexOf(end)).filter(x => x !== -1));
  if(index === 0) {
    return firstPart.length;
  }
  return index;
}

/**
 * @param{str} the string that should start with a value from arr. Whitespaces at the beginning will be ignored.
 * @param{arr} an array of strings representing possible start values for str
 * @return an elment from arr that is the prefix of str (after whitespaces) if there is any, else undefined
 */
function getStartingCharacterFromArray(str, arr) {
  return arr.find(x => str.trim().indexOf(x) === 0);
}

/**
 * @parm{str} the string that should be trimmed
 * @return a modified version of str stripped of all whitespaces (space, tab and newline)
 */
function trimAll(str) {
  return str.replace(/\s|\t|\n/g, '');
}
