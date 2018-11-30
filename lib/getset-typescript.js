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


    let editor;
    if (editor = atom.workspace.getActiveTextEditor()) {
      // iterate over each selection in case the user has selected multiple areas
      // seriously, who does this??
      editor.getSelectedBufferRanges().forEach(range => {
        // set the cursor to the end of the selected paragraph in order to append text later
        const curCursorPos = editor.getCursorBufferPosition();
        editor.setCursorBufferPosition(range.end);

        const selectedLines = editor.getTextInBufferRange(range).split('\n');
        // evaluate each line separately
        selectedLines.forEach(line => {
            // it's possible that there are multiple variables in one line (why?)
            line.split(';').forEach(possibleVariable => {
              // pseudo-check if the possible variable is a private member variable and not a function
              if(possibleVariable.includes('private') && possibleVariable.includes('_') && !possibleVariable.includes('{')) {
                let varName;
                if(varName = utils.extractVarName(possibleVariable)) {
                  const varType = utils.extractType(possibleVariable);
                  editor.insertText('\n\n');
                  editor.insertText(utils.generateGetterFor(varName, varType));
                  editor.insertText('\n\n');
                  editor.insertText(utils.generateSetterFor(varName, varType));
                  hasGenerated = true;
                }
              }
            });
          });
          editor.setCursorBufferPosition(curCursorPos);
        });
      };
      if(!hasGenerated) {
        atom.notifications.addWarning('Can\'t find any possible private members. Do they start with \'_\'?');
      } else {
        atom.notifications.addSuccess('Generation successful :)');
      }
    }
};
