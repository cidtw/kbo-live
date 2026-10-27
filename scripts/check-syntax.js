#!/usr/bin/env node
'use strict';
// `node --check` every CLI source file (bin/, src/, locales/) instead of a hand-maintained list.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const files = ['bin', 'src', 'locales'].flatMap((dir) =>
  fs
    .readdirSync(path.join(root, dir))
    .filter((f) => f.endsWith('.js'))
    .map((f) => path.join(dir, f)),
);

let failed = 0;
for (const file of files) {
  try {
    execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'inherit' });
  } catch {
    failed += 1;
    console.error(`syntax error: ${file}`);
  }
}
console.log(`checked ${files.length} files, ${failed} failed`);
process.exit(failed ? 1 : 0);
