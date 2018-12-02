'use babel';

import { CompositeDisposable } from 'atom';
const utils = require('./generatorUtils.js');

export default {

  subscriptions: null,



  activate() {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'getset-typescript:generate': () => this.generate()
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  generate() {
    //atom.notifications.addWarning(error.reason)
    let hasGenerated = false;
    let alreadyExisting = false;
    let curCursorPos;

    let privatePrefix = atom.config.get('getset-typescript.privatePrefix');
    if(!privatePrefix) {
      privatePrefix = '_';
      atom.config.set('getset-typescript.privatePrefix', privatePrefix);
    }

    atom.config.observe('getset-typescript.privatePrefix', newValue => privatePrefix = newValue);

    let editor;
    if (editor = atom.workspace.getActiveTextEditor()) {
       curCursorPos = editor.getCursorBufferPosition()
      // iterate over each selection in case the user has selected multiple areas
      // seriously, who does this??
      editor.getSelectedBufferRanges().forEach(range => {
        // set the cursor to the end of the selected paragraph in order to append text later
        editor.setCursorBufferPosition(range.end);

        const selectedLines = editor.getTextInBufferRange(range).split('\n');
        // evaluate each line separately
        selectedLines.forEach(line => {
            // it's possible that there are multiple variables in one line (why?)
            line.split(';').forEach(possibleVariable => {
              // pseudo-check if the possible variable is a private member variable and not a function
              if(possibleVariable.includes('private') && possibleVariable.includes(privatePrefix)) {
                let varName;
                if(varName = utils.extractVarName(possibleVariable, privatePrefix)) {
                  const varType = utils.extractType(possibleVariable);
                  if(!editor.getText().includes(`get ${varName}(`)) {
                    editor.insertText('\n\n');
                    editor.insertText(utils.generateGetterFor(varName, varType, privatePrefix));
                  } else {
                    alreadyExisting = true;
                  }
                  if(!editor.getText().includes(`set ${varName}(`)) {
                    editor.insertText('\n\n');
                    editor.insertText(utils.generateSetterFor(varName, varType, privatePrefix));
                  } else {
                    alreadyExisting = true;
                  }
                  hasGenerated = true;
                }
              }
            });
          });
        });
      };

      editor.selectAll();
      atom.commands.dispatch(atom.views.getView(editor), "editor:auto-indent");
      editor.setCursorBufferPosition(curCursorPos);

      if(!hasGenerated) {
        atom.notifications.addWarning(`Can't find any possible private members. Do they start with '${privatePrefix}'?`);
      } else {
        if(alreadyExisting) {
          atom.notifications.addInfo('Some getters and setters for the selected variables already exist');
        }
        atom.notifications.addSuccess('Generation successful :)');
      }

    }
};
