'use babel';

import { CompositeDisposable } from 'atom';

export default {
  _configPathPrivatePrefix: 'getset-typescript.privatePrefix',
  _privatePrefix: '_',
  _subscriptions: null,
  _utils: require('./generator.js'),
  _editor: null,

  activate() {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this._subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this._subscriptions.add(atom.commands.add('atom-workspace', {
      'getset-typescript:generate': () => this.generate()
    }));

    this.initConfig();
    atom.config.observe(this._configPathPrivatePrefix, newValue => {
      if(newValue) {
        this._privatePrefix = newValue;
      } else {
        this.initConfig();
      }
    });
  },

  deactivate() {
    this._subscriptions.dispose();
  },

  generate() {
    this._editor = atom.workspace.getActiveTextEditor();

    if (!this._editor) {
      atom.notifications.addError('An unkown error occured.');
      return;
    }

    const curCursorPos = this._editor.getCursorBufferPosition()
    let codeHasBeenAdded = false;
    // iterate over each selection in case the user has selected multiple areas
    // seriously, who does this??
    for(let range of this._editor.getSelectedBufferRanges()) {
      // set the cursor to the end of the selected paragraph in order to append text later
      this._editor.setCursorBufferPosition(range.end);
      let getterSetterConcat = '';
      // evaluate each line separately
      for(let line of this._editor.getTextInBufferRange(range).split('\n')) {
        // it's possible that there are multiple variables in one line
        for(let possibleVariable of line.split(';')) {
          getterSetterConcat += this.generateGetterAndSetter(possibleVariable);
        }
      }

      if(getterSetterConcat && getterSetterConcat !== '') {
        this._editor.insertText(getterSetterConcat);
        this._editor.setSelectedBufferRange([[range.end.row + 2, 0], [range.end.row + getterSetterConcat.split('\n').length, 0]]);
        this.beautify();
        codeHasBeenAdded = true;
      }
    }

    this._editor.setCursorBufferPosition(curCursorPos);

    if(!codeHasBeenAdded) {
      atom.notifications.addWarning(`Either your private members do not start with '${this._privatePrefix}' or the accessors are already existent`);
    }

  },

  /**
   * Beautify the selection the user has made using atom-beautify or atom-indent if beautify not existent
   */
  beautify() {
    if(atom.packages.isPackageActive('atom-beautify')) {
      setTimeout(() => {
        atom.commands.dispatch(atom.views.getView(this._editor), "atom-beautify:beautify-editor");
      });
    } else {
      atom.commands.dispatch(atom.views.getView(this._editor), "editor:auto-indent");
    }
  },

  /*
   * Generate a string containing possible setter and getter if they are not already existent or an empty string
   * if no accessors could/have been generated
   */
  generateGetterAndSetter(possibleVariable) {
    this._utils.init(possibleVariable, this._privatePrefix);

    let result = '';
    const possibleGetter = this._utils.generateGetterIfPossible();
    if(!this._utils.isGetterExistent(this._editor.getText()) && possibleGetter) {
      result += '\n\n';
      result += possibleGetter;
    }

    const possibleSetter = this._utils.generateSetterIfPossible();
    if(!this._utils.isSetterExistent(this._editor.getText()) && possibleSetter) {
      result += '\n\n';
      result += possibleSetter;
    }
    return result;
  },

  /**
   * Initialize the private prefix variable and its config
   */
  initConfig() {
    const configPrivatePrefix = atom.config.get(this._configPathPrivatePrefix);
    if(configPrivatePrefix) {
      this._privatePrefix = configPrivatePrefix;
    } else {
      atom.config.set(this._configPathPrivatePrefix, '_');
    }
  }
};
