# babel-type-scopes

> Utils for looking up and working with Flow & TypeScript scopes in Babel

```js
import {
  isTypeScope,
  getClosestTypeScopePath,
  getOwnTypeBindings,
  getTypeBinding,
} from 'babel-type-scopes';

isTypeScope(path); // true | false
getClosestTypeScopePath(path); // (Path)
getOwnTypeBindings(path) // { foo: { kind, path, id }, bar: { kind, path, id } }
getTypeBinding(path, 'foo') // { kind, path, id }
```

## Installation

```sh
yarn add babel-type-scopes
```

## API

#### `isTypeScope(path: Path) => boolean`

Check if a path creates a type scope.

#### `getClosestTypeScope(path: Path) => Path`

Find the closest path to a type scope.

#### `getOwnTypeBindings(path: Path) => Bindings`

Find the closest path to a type scope.

#### `getTypeBinding(path: Path) => Binding`

Search for a binding in the current scope and parent scopes.

### Types

#### `Binding`

```js
type Binding = {
  kind: 'import' | 'declaration' | 'expression' | 'param',
  path: Path,
  id: Path,
};
```

#### `Bindings`

```js
type Bindings = { [name: string]: Binding };
```
