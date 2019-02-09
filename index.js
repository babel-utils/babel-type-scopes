/*::
import type {BabelPath as Path} from 'babel-flow-types';

type Binding = {
  kind: 'import' | 'declaration' | 'expression' | 'param',
  path: Path,
  id: Path,
};

type Bindings = {
  [name: string]: Binding,
};

type Visitor = {
  [method: string]: (path: Path, state: { bindings: Bindings }) => void;
};
*/
let getId = (kind, path, bindings) => {
  if (path.node.id) {
    let id = path.get('id');
    bindings[id.node.name] = {kind, path: id};
  }
};

let visitor /*: Visitor */  = {
  Declaration(path, state) {
    if (
      isTypeDeclaration(path)
    ) {
      getId('declaration', path, state.bindings);
    }

    if (!path.isImportDeclaration() && !path.isExportDeclaration()) {
      path.skip();
    }
  },

  TSTypeParameter(path, state) {
    state.bindings[path.node.name] = {kind: 'param', path};
  },

  TypeParameterDeclaration(path, state) {
    for (const param of path.node.params) {
      state.bindings[param.name] = {kind: 'param', path};
    }
  },

  'ImportSpecifier|ImportDefaultSpecifier'(path, state) {
    let importKind = path.node.importKind || path.parent.importKind;
    if (importKind !== 'type' && importKind !== 'typeof') return;
    let local = path.get('local');
    state.bindings[local.node.name] = {kind: 'import', path: local};
  },
};

function isTypeImport(path) {
  if (!path.isImportSpecifier() && !path.isImportDefaultSpecifier()) {
    return false;
  }

  let importKind = path.node.importKind || path.parent.importKind;
  return importKind === 'type' || importKind === 'typeof';
}

function isTypeDeclaration(path) {
  return (
    path.isTypeAlias() ||
    path.isClassDeclaration() ||
    path.isInterfaceDeclaration() ||
    path.type === 'TSTypeAliasDeclaration' ||
    path.type === 'TSInterfaceDeclaration' ||
    path.type === 'TSEnumDeclaration' ||
    path.type === 'TSModuleDeclaration'
  );
}

function isTypeExpression(path) {
  return path.isClassExpression();
}

function isTypeParam(path) {
  return path.isTypeParameter();
}

function isTypeScope(path /*: Path */) {
  return (
    path.isScope() ||
    path.isFunctionTypeAnnotation() ||
    path.isTypeAlias() ||
    path.isInterfaceDeclaration() ||
    isTypeDeclaration(path)
  );
}

function getOwnTypeBindings(path /*: Path */) {
  if (!isTypeScope(path)) {
    throw new Error('Must pass valid type scope path using getClosestTypeScope()');
  }

  let bindings = {};

  if (isTypeExpression(path) && path.node.id) {
    getId('expression', path, bindings);
  } else {
    path.traverse(visitor, { bindings });
  }

  return bindings;
}

function getTypeBinding(path /*: Path */, name /*: string */) /*: Binding */ {
  let searching = path;

  do {
    searching = getClosestTypeScope(searching);
    let bindings = getOwnTypeBindings(searching);
    if (bindings[name]) return bindings[name];
  } while (searching = searching.parentPath);

  return null;
}

function getClosestTypeScope(path /*: Path */) /*: Path */ {
  return path.find(p => isTypeScope(p));
}

module.exports = {
  isTypeScope,
  getClosestTypeScope,
  getOwnTypeBindings,
  getTypeBinding,
};
