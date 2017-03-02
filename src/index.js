/**
 * This is a Babel plugin to transform an array of string joins into single string.
 *
 * It assumes that ESLint is used to always use template literal if possible.
 * In other word, 'hello' + 1 + 'world' should always be written as `hello${1}world`.
 *
 * However, multiple string concat is allowed, for example, 'hello' + ' ' + 'world'.
 * This is usually used when string is too long and should be split into multiple lines.
 */

/* eslint-disable new-cap */

const t = require('babel-types');

function isString(element) {
  return t.isStringLiteral(element) || t.isTemplateLiteral(element);
}

function stringConcat(_first, _second) {
  if (!isString(_first) || !isString(_second)) throw new Error('Cannot concat non-string.');
  const first = _first.node || _first;
  const second = _second.node || _second;
  if (t.isStringLiteral(first) && t.isStringLiteral(second)) {
    return t.stringLiteral(first.value + second.value);
  }
  if (t.isStringLiteral(first) && t.isTemplateLiteral(second)) {
    const value = typeof second.quasis[0].value === 'string' ? {
      raw: second.quasis[0].value,
      cooked: second.quasis[0].value,
    } : second.quasis[0].value;
    const quasis = second.quasis.slice(0);
    quasis[0] = t.templateElement({
      raw: first.value + value.raw,
      cooked: first.vlaue + value.cooked,
    });
    return t.templateLiteral(quasis, second.expressions.slice(0));
  }
  if (t.isTemplateLiteral(first) && t.isStringLiteral(second)) {
    const quasi = first.quasis[first.quasis.length - 1];
    const value = typeof quasi.value === 'string' ?
      { raw: quasi.value, cooked: quasi.value } : quasi.value;
    const quasis = first.quasis.slice(0);
    quasis[quasis.length - 1] = t.templateElement({
      raw: value.raw + second.value,
      cooked: value.cooked + second.value,
    });
    return t.templateLiteral(quasis, first.expressions.slice(0));
  }
  /** both are template strings */
  const lastQuasi = first.quasis[first.quasis.length - 1];
  return t.templateLiteral(
    [
      ...first.quasis.slice(0, first.quasis.length - 1),
      t.templateElement(
        {
          raw: lastQuasi.value.raw + second.quasis[0].value.raw,
          cooked: lastQuasi.value.cooked + second.quasis[0].value.cooked,
        },
        false
      ),
      ...second.quasis.slice(1),
    ],
    first.expressions.slice(0).concat(second.expressions));
}

function getBinaryExpressionValue(_element) {
  if (isString(_element)) return _element;
  const element = _element.node || _element;
  if (element.operator === '+') {
    return stringConcat(
      getBinaryExpressionValue(element.left),
      getBinaryExpressionValue(element.right));
  }
  return _element;
}

function validateBinaryExpression(_element) {
  const element = _element.node || _element;
  const validate = side =>
    (t.isBinaryExpression(side) && element.operator === '+' ?
      validateBinaryExpression(side) :
      isString(side));
  return validate(element.left) && validate(element.right);
}

function validateElement(element) {
  return isString(element) ||
    (
      t.isBinaryExpression(element) && validateBinaryExpression(element)
    );
}

module.exports = function () {
  return {
    visitor: {
      CallExpression(path) {
        const callee = path.get('callee');
        if (!callee) {
          return;
        }
        /**
         * Skip all calls that is not format of [].join()
         */
        if (!t.isMemberExpression(path.get('callee')) ||
          !t.isArrayExpression(path.get('callee.object')) ||
          path.get('callee.property.name').node !== 'join' ||
          !path.get('callee.object.elements').every(validateElement)) {
          return;
        }
        /** Skip all .join calls if given parameter is not a string */
        if (path.get('arguments').length > 0 &&
          !isString(path.get('arguments')[0])) {
          return;
        }
        const spliter = isString(path.get('arguments')[0]) ?
          path.node.arguments[0] :
          t.StringLiteral(',');
        /** Deal with arrays where template string contains */
        const element = path.get('callee.object.elements')
          .reduce((node, _element) =>
            stringConcat(
              stringConcat(getBinaryExpressionValue(node), spliter),
              getBinaryExpressionValue(_element.node))
            );
        path.replaceWith(element);
        return;
      },
      BinaryExpression(path) {
        if (!validateBinaryExpression(path.node)) return;
        const element = getBinaryExpressionValue(path);
        path.replaceWith(element);
      },
    },
  };
};
