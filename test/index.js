const path = require('path');
const fs= require('fs');
const { transformFileSync } = require('babel-core');
const plugin = require('../src/index');

function trim(str) {
  return str.replace(/^\s+|\s+$/, '');
}

describe('String Join Plugin', () => {
  const fixturesDir = path.join(__dirname, 'fixtures');
  fs.readdirSync(fixturesDir).map((caseName) => {
    if (!fs.statSync(path.join(fixturesDir, caseName)).isDirectory()) return;
    it(`should ${caseName.split('-').join(' ')}`, () => {
      const fixtureDir = path.join(fixturesDir, caseName);
      const actualPath = path.join(fixtureDir, 'actual.js');
      const actual = transformFileSync(actualPath, {
        plugins: [plugin],
      }).code;

      const expected = fs.readFileSync(
          path.join(fixtureDir, 'expected.js')
      ).toString();

      expect(trim(actual)).toEqual(trim(expected));
    });
  });

  it(`should concat string and template correctly in es2015`, () => {
    const caseName = 'concat-string-and-template';
    const fixtureDir = path.join(fixturesDir, caseName);
    const actualPath = path.join(fixtureDir, 'actual.js');
    const actual = transformFileSync(actualPath, {
      plugins: ['transform-es2015-template-literals', plugin],
    }).code.replace(/['"]/g, '"');

    const expected = transformFileSync(path.join(fixtureDir, 'expected.js'), {
      plugins: ['transform-es2015-template-literals'],
    }).code.replace(/['"]/g, '"');

    expect(trim(actual)).toEqual(trim(expected));
  });
  it('should not handle cases', () => {
    const actual = transformFileSync(path.join(fixturesDir, 'should-not-handle-cases.js'), {
      plugins: [plugin],
    }).code;
    const expected = fs.readFileSync(path.join(fixturesDir, 'should-not-handle-cases.js'))
      .toString().replace(/\r\n/g, '\n');
    expect(trim(actual)).toEqual(trim(expected));
  });
});
