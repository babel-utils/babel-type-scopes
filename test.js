'use strict';

const cases = require('jest-in-case');
const {isTypeScope, getOwnTypeBindings, getTypeBinding} = require('./');
const babel = require('@babel/core');

function parse(code, plugins) {
  let file = babel.parseSync(code, { plugins });
  return file;
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

  babel.traverse(path, {
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
  plugins: ['@babel/plugin-syntax-flow'],
  code: 'import type a from "mod";',
  scopes: [['a:import']],
}, {
  name: 'flow import {type}',
  plugins: ['@babel/plugin-syntax-flow'],
  code: 'import {type a} from "mod";',
  scopes: [['a:import']],
}, {
  name: 'flow import typeof',
  plugins: ['@babel/plugin-syntax-flow'],
  code: 'import typeof a from "mod";',
  scopes: [['a:import']],
}, {
  name: 'flow import {typeof}',
  plugins: ['@babel/plugin-syntax-flow'],
  code: 'import {typeof a} from "mod";',
  scopes: [['a:import']],
}, {
  name: 'flow type alias',
  plugins: ['@babel/plugin-syntax-flow'],
  code: 'type a = {};',
  scopes: [['a:declaration'], []],
}, {
  name: 'flow interface declaration',
  plugins: ['@babel/plugin-syntax-flow'],
  code: 'interface a {}',
  scopes: [['a:declaration'], []],
}, {
  name: 'flow class declaration',
  plugins: ['@babel/plugin-syntax-flow'],
  code: 'class a {}',
  scopes: [['a:declaration'], []],
}, {
  name: 'flow type alias params',
  plugins: ['@babel/plugin-syntax-flow'],
  code: 'type a<b> = {};',
  scopes: [['a:declaration'], ['b:param']],
}, {
  name: 'flow interface params',
  plugins: ['@babel/plugin-syntax-flow'],
  code: 'interface a<b> {}',
  scopes: [['a:declaration'], ['b:param']],
}, {
  name: 'flow class params',
  plugins: ['@babel/plugin-syntax-flow'],
  code: 'class a<b> {}',
  scopes: [['a:declaration'], ['b:param']],
}, {
  name: 'flow function params',
  plugins: ['@babel/plugin-syntax-flow'],
  code: 'function a<b>() {}',
  scopes: [[], ['b:param']],
}, {
  name: 'flow type alias params',
  plugins: ['@babel/plugin-syntax-flow'],
  code: 'type a<b> = {};',
  scopes: [['a:declaration'], ['b:param']],
}, {
  name: 'flow class expression',
  plugins: ['@babel/plugin-syntax-flow'],
  code: 'let a = class b {}',
  scopes: [[], ['b:expression']],
}, {
  name: 'flow class without id',
  plugins: ['@babel/plugin-syntax-flow'],
  code: 'let a = class {}',
  scopes: [[], []],
}, {
  name: 'typescript type alias',
  plugins: ['@babel/plugin-syntax-typescript'],
  code: 'type a = {};',
  scopes: [['a:declaration'], []],
}, {
  name: 'typescript interface params',
  plugins: ['@babel/plugin-syntax-typescript'],
  code: 'interface a<b> {}',
  scopes: [['a:declaration'], ['b:param']],
}, {
  name: 'typescript class params',
  plugins: ['@babel/plugin-syntax-typescript'],
  code: 'class a<b> {}',
  scopes: [['a:declaration'], ['b:param']],
}, {
  name: 'typescript function params',
  plugins: ['@babel/plugin-syntax-typescript'],
  code: 'function a<b>() {}',
  scopes: [[], ['b:param']],
}, {
  name: 'typescript type alias params',
  plugins: ['@babel/plugin-syntax-typescript'],
  code: 'type a<b> = {};',
  scopes: [['a:declaration'], ['b:param']],
}, {
  name: 'typescript enum param',
  plugins: ['@babel/plugin-syntax-typescript'],
  code: 'enum a {}',
  scopes: [['a:declaration'], []],
}, {
  name: 'typescript class expression',
  plugins: ['@babel/plugin-syntax-typescript'],
  code: 'let a = class b {}',
  scopes: [[], ['b:expression']],
}, {
  name: 'typescript class without id',
  plugins: ['@babel/plugin-syntax-typescript'],
  code: 'let a = class {}',
  scopes: [[], []],
}]);

function searchForBinding(code, plugins) {
  let path = parse(code, plugins);
  let binding;

  babel.traverse(path, {
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
  plugins: ['@babel/plugin-syntax-flow'],
  code: 'type END = 1; START;',
  found: true,
}, {
  name: 'flow nested scope',
  plugins: ['@babel/plugin-syntax-flow'],
  code: 'type END = 1; function a() { START; }',
  found: true,
}, {
  name: 'flow deep nested scope',
  plugins: ['@babel/plugin-syntax-flow'],
  code: 'type END = 1; function a() { function a() { START; } }',
  found: true,
}, {
  name: 'flow sibling scope',
  plugins: ['@babel/plugin-syntax-flow'],
  code: 'function a() { type END = 1; } function b() { START; }',
  found: false,
}, {
  name: 'flow parent scope',
  plugins: ['@babel/plugin-syntax-flow'],
  code: 'START; function a() { type END = 1; }',
  found: false,
}, {
  name: 'typescript own scope',
  plugins: ['@babel/plugin-syntax-typescript'],
  code: 'type END = 1; START;',
  found: true,
}, {
  name: 'typescript nested scope',
  plugins: ['@babel/plugin-syntax-typescript'],
  code: 'type END = 1; function a() { START; }',
  found: true,
}, {
  name: 'typescript deep nested scope',
  plugins: ['@babel/plugin-syntax-typescript'],
  code: 'type END = 1; function a() { function a() { START; } }',
  found: true,
}, {
  name: 'typescript sibling scope',
  plugins: ['@babel/plugin-syntax-typescript'],
  code: 'function a() { type END = 1; } function b() { START; }',
  found: false,
}, {
  name: 'typescript parent scope',
  plugins: ['@babel/plugin-syntax-typescript'],
  code: 'START; function a() { type END = 1; }',
  found: false,
}]);
