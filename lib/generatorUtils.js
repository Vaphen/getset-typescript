module.exports = (function(){
    class TypeIdentifierTuple {
      constructor(typeName, identifierArr) {
        this.typeName = typeName;
        this.identifierArr = identifierArr;
      }
    }

    const typeIdentifiers = {
      boolean: new TypeIdentifierTuple('boolean', ['true', 'false']),
      string: new TypeIdentifierTuple('string', ['\'', '\`', '\"']),
      any: new TypeIdentifierTuple('any', ['any', 'undefined', 'null']),
      object: new TypeIdentifierTuple('object', [/* not implemented yet */]),
      symbol: new TypeIdentifierTuple('symbol', ['symbol(']),
      upperSymbol: new TypeIdentifierTuple('Symbol', ['Symbol(']),
      function: new TypeIdentifierTuple('function', [/* not implemneted yet */]),
      class: new TypeIdentifierTuple('class', ['new ']),
      // TODO: specs for regexp
      regexp: new TypeIdentifierTuple('RegExp', ['/']),
      number: new TypeIdentifierTuple('number', ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.']),
    }

    return {


      extractVarName(str, privatePrefix) {
        if(!this.isPrivateVariableDefinition(str)) {
          return;
        }

        const namePart = this.getPartBetween(str, 'private', [':', '=', ';', '\n']).trim();

        // determine if the variable name starts with the private prefix
        // TODO: handle deconstruction of classes (private {x, y} = A)
        if(namePart.indexOf(privatePrefix) !== 0) {
          return;
        }

        return this.getPartBetween(namePart, privatePrefix, [' ', '\n', ';']);
      },

      /**
       * @param{str} the string of which the type should be extracted
       * @return the type as string if it could be determined, else 'any'
       */
      extractType(str) {
        const definitionType = this.extractTypeByDefinition(str);
        if(definitionType) {
          return definitionType;
        }
        const assignmentType = this.extractTypeByAssignment(str);
        if(assignmentType) {
          return assignmentType;
        }
        return 'any';
      },

      /**
       * @param{str} the string to check whether it is a private variable definition or not
       * @return true if it is a private variable definition (not a function or public etc.), else false
       */
      isPrivateVariableDefinition(str) {
        const variableRegxp = /private +[^{].[^(]*[:|=|;|\n].*/;
        return str.match(variableRegxp);
      },

      /*
       * @param{str} the string to determine the type by its assignment
       * @return the determined type name if any, else undefined
       */
      extractTypeByAssignment(str) {
        const valueStr = str.substr(this.getPositionOfAssignment(str) + 1, str.length);

        for(const typeIdentifier of Object.values(typeIdentifiers)) {
          const typeStartID = this.getStartingCharacterFromArray(valueStr, typeIdentifier.identifierArr);
          if(typeStartID) {
            // in case it is a custom class, extract the type name from the assignment's name
            if(typeIdentifier.typeName === typeIdentifiers.class.typeName) {
              return this.getPartBetween(valueStr, typeStartID, ['\n', ';', '(', ' ']);
            }
            return typeIdentifier.typeName;
          }
        }

        return undefined;
      },

      /*
       * @param{str} the string to determine the assignment position
       * @return the position of the assignment operator (which means, not =>, but a single = sign), -1 if none
       */
      getPositionOfAssignment(str) {
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
      },

      /*
       * @param{str} the string to extract the given type definition
       * @return the type definition from the input string if any, else undefined
       */
      extractTypeByDefinition(str) {
        if(this.containsTypeDefinition(str) && this.containsLambdaSignature(str)) {
            return this.extractLambdaDefinition(str);
        }
        if(this.containsTypeDefinition(str) && !this.containsClassIdentifier(str)) {
          return this.getPartBetween(this.trimAll(str), ':', [';', '\n', '=']);
        }
        return undefined;
      },

      /*
       * @param{str} the string to check for an existing anonymous class identifier
       * @return true if an identifier was found, else false
       */
      containsClassIdentifier(str) {
        return str.indexOf('{') !== -1;
      },

      /*
       * @param{str} the string to check for an existing type definition
       * @return true if type definition was found, else false
       */
      containsTypeDefinition(str) {
        return str.indexOf(':') !== -1;
      },

      /*
       * @param{str} the string to check for lambda signature (= type definition)
       * @return true if lambda type was found, else false
       */
      containsLambdaSignature(str) {
        const lambdaRegex = /.*\:.*=>.*/;
        return str.match(lambdaRegex);
      },

      /*
       * @param{str} string containing the lambda definition
       * @return{str} the lambda type definition between the chracters ':' and '=' (assignment, not '=>')
       */
      extractLambdaDefinition(str) {
        const trimmedStr = this.trimAll(str);
        const firstPart = this.getPartBetween(trimmedStr, ':', [';', '\n']);
        // find second occurence of '=' sign (that one after => which is the assignment)
        const positionOfAssignment = this.getPositionOfAssignment(firstPart);
        return positionOfAssignment === -1 ? firstPart : firstPart.substr(0, positionOfAssignment);
      },

      /**
       * @param{str} the string to get the part between
       * @param{startPattern} a string representing the start of the split (first occurance will be used)
       * @param{possibleEndsArray} an array of strings representing the end of the split (first occurance of any char)
       * @return a part of str between startPattern and the smallest index of possibleEndsArray in str after startPattern
       */
      getPartBetween(str, startPattern, possibleEndsArray) {
        const firstPart = str.substr(str.indexOf(startPattern) + startPattern.length, str.length);
        return firstPart.substr(0, this.getIndexOfFirstOccurance(firstPart, possibleEndsArray));
      },

      /**
       * @param{str} the string to find the first occurance in
       * @param{arr} an array containng strings
       * @return smallest index of an element from arr in str if there is any, else str.length
       */
      getIndexOfFirstOccurance(str, arr) {
        const index = Math.min(...arr.map(end => str.indexOf(end)).filter(x => x !== -1));
        if(index === 0) {
          return firstPart.length;
        }
        return index;
      },

      /**
       * @param{str} the string that should start with a value from arr. Whitespaces at the beginning will be ignored.
       * @param{arr} an array of strings representing possible start values for str
       * @return an elment from arr that is the prefix of str (after whitespaces) if there is any, else undefined
       */
      getStartingCharacterFromArray(str, arr) {
        return arr.find(x => str.trim().indexOf(x) === 0);
      },

      /**
       * @parm{str} the string that should be trimmed
       * @return a modified version of str stripped of all whitespaces (space, tab and newline)
       */
      trimAll(str) {
        return str.replace(/\s|\t|\n/g, '');
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
})();
