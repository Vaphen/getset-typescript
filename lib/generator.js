module.exports = {

  _utils: require('./generatorUtils.js'),

  init(possibleVariable, privatePrefix) {
    this._variableName = this._utils.extractVarName(possibleVariable, privatePrefix);
    this._variableType = this._utils.extractType(possibleVariable);
    this._privatePrefix = privatePrefix;
  },

  isGetterExistent(referenceText) {
    const getterRegexp = new RegExp('[ |\\t]*get[ |\\t]+' + this._variableName + '[ |\\t]*\\(.*', 'g');
    return referenceText.match(getterRegexp);
  },

  isSetterExistent(referenceText) {
    const setterRegexp = new RegExp('[ |\\t]*set[ |\\t]+' + this._variableName + '[ |\\t]*\\(.*', 'g');
    return referenceText.match(setterRegexp);
  },

  generateGetterIfPossible() {
    if(!this._variableName) {
      return;
    }
    return this._utils.generateGetterFor(this._variableName, this._variableType, this._privatePrefix);
  },

  generateSetterIfPossible() {
      if(!this._variableName) {
        return;
      }
      return this._utils.generateSetterFor(this._variableName, this._variableType, this._privatePrefix);
  },
};
