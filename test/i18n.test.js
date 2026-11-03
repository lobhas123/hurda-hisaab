const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const i18n = require('../js/i18n.js');

test('all tr() keys in app.js exist in i18n.js', () => {
  const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
  const regex = /\btr\(\s*['"]([^'"]+)['"]/g;
  let match;
  const missing = [];
  while ((match = regex.exec(appCode)) !== null) {
    const key = match[1];
    if (!i18n.messages[key]) {
      missing.push(key);
    }
  }
  assert.deepEqual(missing, []);
});

test('all plural() keys in app.js exist in i18n.js', () => {
  const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
  const pluralRegex = /\bplural\(\s*[^,]+,\s*['"]([^'"]+)['"],\s*['"]([^'"]+)['"]/g;
  let match;
  const missing = [];
  while ((match = pluralRegex.exec(appCode)) !== null) {
    if (!i18n.messages[match[1]]) missing.push(match[1]);
    if (!i18n.messages[match[2]]) missing.push(match[2]);
  }
  assert.deepEqual(missing, []);
});

test('i18n switches language and formats correctly', () => {
  i18n.setLanguage('en');
  assert.equal(i18n.t('app.name'), 'Hurda Hisaab');
  assert.equal(i18n.locale(), 'en-IN');

  i18n.setLanguage('mr');
  assert.equal(i18n.t('app.name'), 'हुरडा हिसाब');
  assert.equal(i18n.locale(), 'mr-IN-u-nu-latn');

  // Interpolation
  const greeting = i18n.t('txn.perUnit', { unit: 'किलो' });
  assert.equal(greeting, 'प्रति किलो');
});

test('index.html and sw.js include i18n.js', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  assert.match(indexHtml, /<script src="js\/i18n\.js"><\/script>/);

  const swJs = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
  assert.match(swJs, /'\.\/js\/i18n\.js'/);
});

test('all data-action buttons in app.js are handled in handleClick', () => {
  const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
  const actionRegex = /data-action=["']([^"']+)["']/g;
  let m;
  const actions = new Set();
  while ((m = actionRegex.exec(appCode)) !== null) {
    actions.add(m[1]);
  }

  const caseRegex = /case\s+['"]([^'"]+)['"]:/g;
  const cases = new Set();
  while ((m = caseRegex.exec(appCode)) !== null) {
    cases.add(m[1]);
  }

  const missing = [];
  for (const a of actions) {
    if (!cases.has(a)) {
      missing.push(a);
    }
  }
  assert.deepEqual(missing, []);
});

