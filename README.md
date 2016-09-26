# babel-plugin-transform-string-join

Babel plugin that will join strings and template strings in compilation time whenever it's possible.

## Examples

### Array.proptotype.join

You can use `Array.proptotype.join` to join list of strings and template strings together.

**In**

```js
const className = 'container';
const html = [
  `<div class=${className}>`,
    '<span>Hello World</span>',
  '</div>',
].join('');
```

**Out**

```js
const html = `<div class=${className}><span>Hello World</span></div>`;
```

### String addition

Also, you can use `+` to simply concat strings and template strings together.

**In**

```js
const className = 'container';
const html =
  `<div class=${className}>` +
    '<span>Hello World</span>' +
  '</div>';
```

**Out**

```js
const html = `<div class=${className}><span>Hello World</span></div>`;
```

## Installation

```sh
$ npm install babel-plugin-transform-string-join
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": ["babel-plugin-transform-string-join"]
}
```

### Via CLI

```sh
$ babel --plugins babel-plugin-transform-string-join script.js
```

### Via Node API

```javascript
require('babel-core').transform('code', {
  plugins: ['babel-plugin-transform-string-join']
});
```