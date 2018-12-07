'use babel';

// import GetsetTypescript from '../lib/getset-typescript';

// Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
//
// To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
// or `fdescribe`). Remove the `f` to unfocus the block.

describe('GetsetTypescript', () => {
  const utils = require('../lib/generatorUtils.js');

  describe('test type and variable name detection', () => {

    it('should determine the correct variable name or return undefined', () => {
      const test1 = 'private _test1 = true;';
      const test2 = 'private _test_2 = "hello";'
      const test3 = 'private _longNameTest3: boolean;'
      const test4 = 'private _hello_you_there: boolean = true;'
      const test5 = 'private _test() { console.log("holla"); }'
      const test6 = 'private _test2: () => void;'
      const test7 = 'private _test3 = () => console.log("hey");'
      const test8 = 'private _test4(sometest: () => void) { console.log("holla"); }'
      const test9 = 'public _test5: number;'

      expect(utils.extractVarName(test1, '_')).toBe('test1');
      expect(utils.extractVarName(test2, '_')).toBe('test_2');
      expect(utils.extractVarName(test3, '_')).toBe('longNameTest3');
      expect(utils.extractVarName(test4, '_')).toBe('hello_you_there');
      expect(utils.extractVarName(test5, '_')).toBe(undefined);
      expect(utils.extractVarName(test6, '_')).toBe('test2');
      expect(utils.extractVarName(test7, '_')).toBe('test3');
      expect(utils.extractVarName(test8, '_')).toBe(undefined);
      // determine variable name for all modifiers (private, prot., pub.)
      expect(utils.extractVarName(test9, '_')).toBe('test5');

      // wrong prefix
      expect(utils.extractVarName(test1, 'priv_')).toBe(undefined);
    });

    it('should determine booleans correctly', () => {
      const test1 = 'private _test1 = true;';
      const test2 = 'private _test2 = false;'
      const test3 = 'private _test3: boolean;'
      const test4 = 'private _test4: boolean = true;'
      const tests = [test1, test2, test3, test4];

      tests.forEach(test => expect(utils.extractType(test)).toBe('boolean'));
    });

    it('should determine strings correctly', () => {
      const test1 = 'private _test1 = "test";';
      const test2 = 'private _test2 = \'test\';';
      const test3 = 'private _test3 = `test`;';
      const test4 = 'private _test4: string;';
      const test5 = 'private _test5: string = "test";';
      const tests = [test1, test2, test3, test4, test5];

      tests.forEach(test => expect(utils.extractType(test)).toBe('string'));
    });

    it('should determine any correctly', () => {
      const test1 = 'private _test1: any;';
      const test2 = 'private _test2: any = true;';
      const test3 = 'private _test3 = undefined;';
      const test4 = 'private _test4 = null;';
      const anyTests = [test1, test2, test3, test4];

      const test5 = 'private _test5: undefined;';
      const undefinedTests = [test5];


      const test6 = 'private _test6: null;';
      const nullTests = [test6];

      anyTests.forEach(test => expect(utils.extractType(test)).toBe('any'));
      undefinedTests.forEach(test => expect(utils.extractType(test)).toBe('undefined'));
      nullTests.forEach(test => expect(utils.extractType(test)).toBe('null'));
    });

    it('should not determine anonymous objects', () => {
      const test1 = "private _test1: {a: number, b: number};";
      const test2 =
`private _test2: {
  a: number,
  b: number
};`;
      const test3 = 'private _test3 = {a: 2, b: 3};';
      const test4 =
`private _test4 = {
  a: 3,
  b: 2
};`;
      const tests = [test1, test2, test3, test4];
      tests.forEach(test => expect(utils.extractType(test)).toBe('any'));
    });

    it('should determine symbols', () => {
      const test1 = "private _test1: Symbol;";
      const test2 = "private _test1 = Symbol();";
      const test3 = "private _test1: Symbol = Symbol();";
      const bigSymbolTests = [test1, test2, test3];

      const test4 = "private _test1: symbol;";
      const test5 = "private _test1 = symbol();";
      const test6 = "private _test1: symbol = Symbol();";
      const smallSymbolTests = [test4, test5, test6];

      bigSymbolTests.forEach(test => expect(utils.extractType(test)).toBe('Symbol'));
      smallSymbolTests.forEach(test => expect(utils.extractType(test)).toBe('symbol'));
    });


    it('should not determine lambda functions', () => {
      const test1 = "private _test1: () => void;";
      const test2 = "private _test2 = () => console.log('test');";
      const test3 =
`private _test3 = () => {
  console.log("test");
  return 2;
};`;
      const typedTests = [test1];
      const withoutTypeTests = [test2, test3];
      typedTests.forEach(test => expect(utils.extractType(test)).toBe('()=>void'));
      withoutTypeTests.forEach(test => expect(utils.extractType(test)).toBe('any'));
    });

    it('should not determine custom classes', () => {
      const test1 = "private _test1: A;";
      const test2 = "private _test2 = new A();";
      const test3 = "private _test3:A = new A();";
      // in case A is parent of B
      const test4 = "private _test4:A = new B();";
      const test5 = "private _test5:A = factory.createA();"
      const tests = [test1, test2, test3, test4, test5];

      tests.forEach(test => expect(utils.extractType(test)).toBe('A'));
    });

    it('should determine numbers', () => {
      const test1 = "private _test1: number;";
      const test2 = "private _test2 = 4;";
      const test3 = "private _test3:number = 2.4;";
      const test4 = "private _test4 = 321.87;";
      const test5 = "private _test5 = 0x11;";
      const test6 = "private _test6 = .123;";
      const tests = [test1, test2, test3, test4, test5, test6];

      tests.forEach(test => expect(utils.extractType(test)).toBe('number'));
    });

    it('should determine union types', () => {
      const test1 = "private _test1: number | string;"
      const test2 = "private _test2: number | string = 5;"
      const test3 = "private _test3: number | Subject<boolean> | boolean;"

      expect(utils.extractType(test1)).toBe('number|string');
      expect(utils.extractType(test2)).toBe('number|string');
      expect(utils.extractType(test3)).toBe('number|Subject<boolean>|boolean');
    });

    it('should ignore assignments by functions or similar things', () => {
      const test1 = "private _test1 = factory.getSomeClass();"
      const test2 = "private _test2 = MyClass.Instance;"
      const test3 = "private _test3 = this;"
      // don't fool it by having 'new' or 'symbol' keyword in name
      const test4 = "private _test4 = newThingy();"
      const test5 = "private _test5 = symbolFunction();"
      const tests = [test1, test2, test3, test4, test5];

      tests.forEach(test => expect(utils.extractType(test)).toBe('any'));
    });
  });
});
