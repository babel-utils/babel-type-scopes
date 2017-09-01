// @flow
'use strict';

const cases = require('jest-in-case');
const createBabylonOptions = require('babylon-options');
const {isTypeScope, getOwnTypeBindings, getTypeBinding} = require('./');
const babel = require('babel-core');

function parse(code, plugins) {
  let parserOpts = createBabylonOptions({
    stage: 1,
    plugins,
  });

  let file = new babel.File({
    options: { parserOpts },
    passes: [],
  });

  file.addCode(code);
  file.parseCode(code);

  return file.path;
}

function getAllOwnBindings(code, plugins) {
  let path = parse(code, plugins);
  let scopes = [];

  function visit(path) {
    if (isTypeScope(path)) {
      let bindings = getOwnTypeBindings(path);

      scopes.push(Object.keys(bindings).map(name => {
        return `${name}:${bindings[name].kind}`;
      }));
    }
  }

  visit(path);

  path.traverse({
    enter(path) {
      visit(path);
    },
  });

  return scopes;
}

cases('getOwnBindings()', opts => {
  expect(getAllOwnBindings(opts.code, opts.plugins)).toEqual(opts.scopes);
}, [{
  name: 'flow import type',
  plugins: ['flow'],
  code: 'import type a from "mod";',
  scopes: [['a:import']],
}, {
  name: 'flow import {type}',
  plugins: ['flow'],
  code: 'import {type a} from "mod";',
  scopes: [['a:import']],
}, {
  name: 'flow import typeof',
  plugins: ['flow'],
  code: 'import typeof a from "mod";',
  scopes: [['a:import']],
}, {
  name: 'flow import {typeof}',
  plugins: ['flow'],
  code: 'import {typeof a} from "mod";',
  scopes: [['a:import']],
}, {
  name: 'flow type alias',
  plugins: ['flow'],
  code: 'type a = {};',
  scopes: [['a:declaration'], []],
}, {
  name: 'flow interface declaration',
  plugins: ['flow'],
  code: 'interface a {}',
  scopes: [['a:declaration'], []],
}, {
  name: 'flow class declaration',
  plugins: ['flow'],
  code: 'class a {}',
  scopes: [['a:declaration'], []],
}, {
  name: 'flow type alias params',
  plugins: ['flow'],
  code: 'type a<b> = {};',
  scopes: [['a:declaration'], ['b:param']],
}, {
  name: 'flow interface params',
  plugins: ['flow'],
  code: 'interface a<b> {}',
  scopes: [['a:declaration'], ['b:param']],
}, {
  name: 'flow class params',
  plugins: ['flow'],
  code: 'class a<b> {}',
  scopes: [['a:declaration'], ['b:param']],
}, {
  name: 'flow function params',
  plugins: ['flow'],
  code: 'function a<b>() {}',
  scopes: [[], ['b:param']],
}, {
  name: 'flow type alias params',
  plugins: ['flow'],
  code: 'type a<b> = {};',
  scopes: [['a:declaration'], ['b:param']],
}, {
  name: 'flow class expression',
  plugins: ['flow'],
  code: 'let a = class b {}',
  scopes: [[], ['b:expression']],
}, {
  name: 'flow class without id',
  plugins: ['flow'],
  code: 'let a = class {}',
  scopes: [[], []],
}, {
  name: 'typescript type alias',
  plugins: ['typescript'],
  code: 'type a = {};',
  scopes: [['a:declaration'], []],
}, {
  name: 'typescript interface params',
  plugins: ['typescript'],
  code: 'interface a<b> {}',
  scopes: [['a:declaration'], ['b:param']],
}, {
  name: 'typescript class params',
  plugins: ['typescript'],
  code: 'class a<b> {}',
  scopes: [['a:declaration'], ['b:param']],
}, {
  name: 'typescript function params',
  plugins: ['typescript'],
  code: 'function a<b>() {}',
  scopes: [[], ['b:param']],
}, {
  name: 'typescript type alias params',
  plugins: ['typescript'],
  code: 'type a<b> = {};',
  scopes: [['a:declaration'], ['b:param']],
}, {
  name: 'typescript enum param',
  plugins: ['typescript'],
  code: 'enum a {}',
  scopes: [['a:declaration'], []],
}, {
  name: 'typescript class expression',
  plugins: ['typescript'],
  code: 'let a = class b {}',
  scopes: [[], ['b:expression']],
}, {
  name: 'typescript class without id',
  plugins: ['typescript'],
  code: 'let a = class {}',
  scopes: [[], []],
}]);

function searchForBinding(code, plugins) {
  let path = parse(code, plugins);
  let binding;

  path.traverse({
    Identifier(path) {
      if (path.node.name === 'START') {
        binding = getTypeBinding(path, 'END');
      }
    },
  });

  return binding;
}

cases('getTypeBinding()', opts => {
  let binding = searchForBinding(opts.code, opts.plugins);
  expect(!!binding).toBe(opts.found);
}, [{
  name: 'own scope',
  plugins: ['flow'],
  code: 'type END = 1; START;',
  found: true,
}, {
  name: 'flow nested scope',
  plugins: ['flow'],
  code: 'type END = 1; function a() { START; }',
  found: true,
}, {
  name: 'flow deep nested scope',
  plugins: ['flow'],
  code: 'type END = 1; function a() { function a() { START; } }',
  found: true,
}, {
  name: 'flow sibling scope',
  plugins: ['flow'],
  code: 'function a() { type END = 1; } function b() { START; }',
  found: false,
}, {
  name: 'flow parent scope',
  plugins: ['flow'],
  code: 'START; function a() { type END = 1; }',
  found: false,
}, {
  name: 'typescript own scope',
  plugins: ['typescript'],
  code: 'type END = 1; START;',
  found: true,
}, {
  name: 'typescript nested scope',
  plugins: ['typescript'],
  code: 'type END = 1; function a() { START; }',
  found: true,
}, {
  name: 'typescript deep nested scope',
  plugins: ['typescript'],
  code: 'type END = 1; function a() { function a() { START; } }',
  found: true,
}, {
  name: 'typescript sibling scope',
  plugins: ['typescript'],
  code: 'function a() { type END = 1; } function b() { START; }',
  found: false,
}, {
  name: 'typescript parent scope',
  plugins: ['typescript'],
  code: 'START; function a() { type END = 1; }',
  found: false,
}]);
