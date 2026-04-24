#!/usr/bin/env node
// Trace Logo.jpeg → public/logo.svg using potrace.
// Run: node scripts/trace-logo.mjs

import { trace } from 'potrace';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const input = resolve('../Logo.jpeg');
const output = resolve('public/logo.svg');

const buf = await readFile(input);

const svg = await new Promise((ok, fail) => {
  trace(
    buf,
    {
      threshold: 128,
      turdSize: 4,
      alphaMax: 1,
      optCurve: true,
      optTolerance: 0.2,
      color: 'currentColor',
      background: 'transparent',
    },
    (err, out) => (err ? fail(err) : ok(out))
  );
});

// Strip any fixed width/height so the SVG scales freely via viewBox.
const cleaned = svg
  .replace(/\swidth="[^"]*"/i, '')
  .replace(/\sheight="[^"]*"/i, '')
  .replace(/<svg /, '<svg aria-label="ProLine Aluminium" role="img" ');

await writeFile(output, cleaned, 'utf8');
console.log(`Wrote ${output} (${cleaned.length} bytes)`);
