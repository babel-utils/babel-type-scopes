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
*/

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
    path.type === 'TSEnumDeclaration'
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
    path.isScope() || path.isFunctionTypeAnnotation() || isTypeDeclaration(path)
  );
}

function ownBindingsCollector(path, collect) {
  if (path.isImportDeclaration() || path.isTypeParameterDeclaration()) return;
  if (isTypeImport(path)) collect('import', path, path.get('local'));
  if (isTypeDeclaration(path)) collect('declaration', path, path.get('id'));
  if (isTypeParam(path)) collect('param', path, path);
  path.skip();
}

function getOwnTypeBindings(path /*: Path */) {
  if (!isTypeScope(path)) {
    throw new Error(
      'Must pass valid type scope path using getClosestTypeScope()'
    );
  }

  let bindings = {};

  function collect(kind, path, id) {
    bindings[path.node.name] = { kind, path, id };
  }

  if (isTypeExpression(path) && path.node.id) {
    collect('expression', path, path.get('id'));
  }

  path.traverse({
    enter(path) {
      ownBindingsCollector(path, collect);
    }
  });

  return bindings;
}

function getTypeBinding(path /*: Path */, name /*: string */) /*: Binding */ {
  let searching = path;

  do {
    searching = getClosestTypeScope(searching);
    let bindings = getOwnTypeBindings(searching);
    if (bindings[name]) return bindings[name];
  } while ((searching = searching.parentPath));

  return null;
}

function getClosestTypeScope(path /*: Path */) /*: Path */ {
  return path.find(p => isTypeScope(p));
}

module.exports = {
  isTypeScope,
  getClosestTypeScope,
  getOwnTypeBindings,
  getTypeBinding
};
