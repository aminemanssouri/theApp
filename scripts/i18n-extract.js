#!/usr/bin/env node
/*
 i18n Extractor for React Native (JS/JSX)
 - Scans project for hardcoded strings in JSX text nodes, common JSX attributes, and Alert.alert
 - Replaces them with t('namespace.key') calls
 - Updates/creates i18n/locales/en.json with discovered keys

 Usage:
   node scripts/i18n-extract.js
*/

const fs = require('fs');
const path = require('path');
const recast = require('recast');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const EN_JSON_PATH = path.join(PROJECT_ROOT, 'i18n', 'locales', 'en.json');
const LANGUAGE_CONTEXT_PATH = path.join(PROJECT_ROOT, 'context', 'LanguageContext.js');

const JS_EXTS = new Set(['.js', '.jsx']);
const IGNORES = ['node_modules', '.git', 'assets', 'build', 'dist', '.expo', '.vscode', 'scripts', 'context', 'i18n'];

function loadJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return {};
  }
}

function saveJSON(file, obj) {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const content = JSON.stringify(obj, null, 2) + '\n';
  fs.writeFileSync(file, content, 'utf8');
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORES.includes(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(abs, out);
    } else if (entry.isFile()) {
      if (JS_EXTS.has(path.extname(entry.name))) out.push(abs);
    }
  }
  return out;
}

function toSnake(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function guessNamespace(file) {
  const base = path.basename(file, path.extname(file)).toLowerCase();
  if (base.includes('login') || base.includes('signup') || base.includes('forgot')) return 'auth';
  if (base.includes('booking')) return 'bookings';
  if (base.includes('home')) return 'home';
  if (base.includes('search')) return 'search';
  if (base.includes('profile')) return 'profile';
  if (base.includes('worker')) return 'worker';
  if (base.includes('service')) return 'service';
  if (base.includes('payment') || base.includes('card')) return 'payment';
  if (base.includes('chat') || base.includes('inbox')) return 'chat';
  if (base.includes('notification')) return 'notifications';
  if (base.includes('help') || base.includes('faq')) return 'help';
  if (base.includes('privacy')) return 'privacy';
  if (base.includes('security')) return 'security';
  if (base.includes('settings')) return 'settings';
  return 'common';
}

function slugFromText(text, maxWords = 6) {
  const words = text
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .slice(0, maxWords)
    .join(' ');
  return toSnake(words).replace(/^\d+$/, 'text');
}

function ensureImportT(ast, filePath) {
  // Already imported?
  let hasImport = false;
  for (const node of ast.program.body) {
    if (t.isImportDeclaration(node)) {
      if (node.source && /LanguageContext/.test(node.source.value)) {
        hasImport = node.specifiers.some(
          s => t.isImportSpecifier(s) && s.imported && s.imported.name === 't'
        );
        if (!hasImport) {
          node.specifiers.push(t.importSpecifier(t.identifier('t'), t.identifier('t')));
          hasImport = true;
        }
      }
    }
  }
  if (!hasImport) {
    const rel = path.relative(path.dirname(filePath), LANGUAGE_CONTEXT_PATH).replace(/\\/g, '/');
    const importPath = rel.endsWith('.js') ? rel.slice(0, -3) : rel; // drop extension
    ast.program.body.unshift(
      t.importDeclaration(
        [t.importSpecifier(t.identifier('t'), t.identifier('t'))],
        t.stringLiteral(importPath.startsWith('.') ? importPath : `./${importPath}`)
      )
    );
  }
}

function setDeep(obj, key, value) {
  const parts = key.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!cur[p] || typeof cur[p] !== 'object') cur[p] = {};
    cur = cur[p];
  }
  const last = parts[parts.length - 1];
  if (!(last in cur)) cur[last] = value;
}

function getDeep(obj, key) {
  return key.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : undefined), obj);
}

function transformFile(file, enDict) {
  const code = fs.readFileSync(file, 'utf8');
  const parser = {
    parse: (src) =>
      parse(src, {
        sourceType: 'module',
        errorRecovery: true,
        allowAwaitOutsideFunction: true,
        allowReturnOutsideFunction: true,
        allowImportExportEverywhere: true,
        tokens: true,
        plugins: [
          'jsx',
          'flow',
          'classProperties',
          'objectRestSpread',
          'decorators-legacy',
          'optionalChaining',
          'nullishCoalescingOperator',
          'exportDefaultFrom',
          'exportNamespaceFrom',
          'dynamicImport',
          'topLevelAwait',
          'numericSeparator',
          'logicalAssignment',
          'optionalCatchBinding',
          'asyncGenerators',
          'doExpressions'
        ],
      }),
  };
  const ast = recast.parse(code, { parser });

  const ns = guessNamespace(file);
  const usedKeys = new Set();
  let changed = false;

  function createKeyFor(text) {
    const base = slugFromText(text);
    let key = `${ns}.${base}`;
    let i = 2;
    while (usedKeys.has(key) || getDeep(enDict, key)) {
      key = `${ns}.${base}_${i++}`;
    }
    usedKeys.add(key);
    setDeep(enDict, key, text.trim());
    return key;
  }

  const ATTRS = new Set(['title', 'placeholder', 'label', 'subtitle', 'headerTitle', 'name', 'text', 'message', 'alt']);

  traverse(ast, {
    JSXText(path) {
      const raw = path.node.value;
      const text = raw.replace(/\s+/g, ' ').trim();
      if (!text) return;
      // Skip if already inside expression container with t()
      const parent = path.parentPath.node;
      if (t.isJSXExpressionContainer(parent)) return;
      const key = createKeyFor(text);
      // Replace with {t('key')}
      path.replaceWith(t.jsxExpressionContainer(
        t.callExpression(t.identifier('t'), [t.stringLiteral(key)])
      ));
      changed = true;
    },
    JSXAttribute(path) {
      const name = path.node.name && path.node.name.name;
      if (!ATTRS.has(name)) return;
      const val = path.node.value;
      if (!val || !t.isStringLiteral(val)) return;
      const text = val.value.trim();
      if (!text) return;
      const key = createKeyFor(text);
      path.node.value = t.jsxExpressionContainer(
        t.callExpression(t.identifier('t'), [t.stringLiteral(key)])
      );
      changed = true;
    },
    CallExpression(path) {
      const callee = path.node.callee;
      if (
        t.isMemberExpression(callee) &&
        t.isIdentifier(callee.object, { name: 'Alert' }) &&
        t.isIdentifier(callee.property, { name: 'alert' })
      ) {
        const args = path.node.arguments;
        for (let i = 0; i < Math.min(2, args.length); i++) {
          if (t.isStringLiteral(args[i])) {
            const key = createKeyFor(args[i].value);
            args[i] = t.callExpression(t.identifier('t'), [t.stringLiteral(key)]);
            changed = true;
          }
        }
      }
    }
  });

  if (changed) {
    ensureImportT(ast, file);
    const output = recast.print(ast, { quote: 'single' }).code;
    fs.writeFileSync(file, output, 'utf8');
  }

  return changed;
}

function collectTargets(argvPaths) {
  if (!argvPaths || argvPaths.length === 0) {
    return walk(PROJECT_ROOT);
  }
  const targets = [];
  for (const p of argvPaths) {
    const abs = path.resolve(PROJECT_ROOT, p);
    if (!fs.existsSync(abs)) continue;
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) walk(abs, targets);
    else if (stat.isFile() && JS_EXTS.has(path.extname(abs))) targets.push(abs);
  }
  return targets;
}

function main() {
  const argv = process.argv.slice(2);
  console.log('🔎 Starting i18n extraction...');
  const files = collectTargets(argv);
  let enDict = loadJSON(EN_JSON_PATH);
  let changedCount = 0;

  for (const file of files) {
    try {
      const changed = transformFile(file, enDict);
      if (changed) {
        changedCount++;
        console.log('✅ Updated:', path.relative(PROJECT_ROOT, file));
      }
    } catch (e) {
      console.warn('⚠️ Skipped (parse error):', path.relative(PROJECT_ROOT, file));
      if (e && e.message) {
        console.warn('   ↳', e.message.split('\n')[0]);
      }
      if (e && e.stack) {
        // Show just the first stack line to hint location
        const lines = e.stack.split('\n');
        if (lines[1]) console.warn('   ↳', lines[1].trim());
      }
    }
  }

  saveJSON(EN_JSON_PATH, enDict);
  console.log(`\n✅ i18n extraction complete. Files changed: ${changedCount}`);
  console.log(`📄 Updated translations: ${path.relative(PROJECT_ROOT, EN_JSON_PATH)}`);
}

if (require.main === module) {
  main();
}
