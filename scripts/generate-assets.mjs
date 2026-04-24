#!/usr/bin/env node
// Generates favicon.svg, apple-touch-icon.png and og-image.png into public/.
// Run: node scripts/generate-assets.mjs

import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const INK_950 = '#0a0b0d';
const INK_900 = '#131519';
const INK_800 = '#1c1e24';
const CHROME_500 = '#c8ccd3';

async function main() {
  const logoPath = resolve('public/logo.svg');
  const logoRaw = await readFile(logoPath, 'utf8');

  // Extract the path 'd' attribute from the traced logo so we can re-embed it.
  const dMatch = logoRaw.match(/<path[^>]*d="([^"]+)"/);
  if (!dMatch) throw new Error('Could not extract path from logo.svg');
  const logoPathD = dMatch[1];

  // Extract the viewBox too.
  const vbMatch = logoRaw.match(/viewBox="([^"]+)"/);
  const viewBox = vbMatch ? vbMatch[1] : '0 0 1498 1050';

  // ── Favicon (rounded dark tile + white logo) ────────────────────────────────
  const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="${INK_950}"/>
  <g transform="translate(8,10) scale(0.032)">
    <path d="${logoPathD}" fill="#ffffff" fill-rule="evenodd"/>
  </g>
</svg>`;
  await writeFile(resolve('public/favicon.svg'), faviconSvg, 'utf8');
  console.log('Wrote public/favicon.svg');

  // ── Apple touch icon (180x180 PNG) ──────────────────────────────────────────
  const touchSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180">
  <rect width="180" height="180" rx="36" fill="${INK_950}"/>
  <g transform="translate(22,32) scale(0.09)">
    <path d="${logoPathD}" fill="#ffffff" fill-rule="evenodd"/>
  </g>
</svg>`;
  await sharp(Buffer.from(touchSvg)).resize(180, 180).png().toFile(resolve('public/apple-touch-icon.png'));
  console.log('Wrote public/apple-touch-icon.png');

  // ── OG image (1200x630) ─────────────────────────────────────────────────────
  // Dark metallic gradient with logo left, wordmark + tagline, service strip at bottom.
  const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${INK_900}"/>
        <stop offset="100%" stop-color="${INK_950}"/>
      </linearGradient>
      <radialGradient id="glow" cx="20%" cy="0%" r="80%">
        <stop offset="0%" stop-color="${CHROME_500}" stop-opacity="0.18"/>
        <stop offset="60%" stop-color="${CHROME_500}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="chrome" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f4f5f7"/>
        <stop offset="100%" stop-color="#a9aeb6"/>
      </linearGradient>
      <style>
        .display { font-family: 'Space Grotesk', 'Inter', system-ui, sans-serif; font-weight: 600; }
        .body    { font-family: 'Inter', system-ui, sans-serif; font-weight: 500; }
      </style>
    </defs>

    <rect width="1200" height="630" fill="url(#bg)"/>
    <rect width="1200" height="630" fill="url(#glow)"/>

    <!-- Hairline bottom -->
    <line x1="80" y1="560" x2="1120" y2="560" stroke="${INK_800}" stroke-width="1"/>

    <!-- Logo mark top-left -->
    <g transform="translate(80,80) scale(0.11)">
      <path d="${logoPathD}" fill="#ffffff" fill-rule="evenodd"/>
    </g>

    <!-- Tagline -->
    <text x="80" y="270" class="body" fill="${CHROME_500}" font-size="22" letter-spacing="4">CHRISTCHURCH &#38; CANTERBURY · OVER 13 YEARS</text>

    <!-- Wordmark headline -->
    <text x="80" y="360" class="display" fill="#ffffff" font-size="96" letter-spacing="-2">ProLine Aluminium</text>

    <!-- Subheadline -->
    <text x="80" y="440" class="display" fill="url(#chrome)" font-size="56" letter-spacing="-1">Repairs &#38; Alterations</text>

    <!-- Service strip -->
    <text x="80" y="595" class="body" fill="#858a93" font-size="20" letter-spacing="0.5">
      Windows &#38; Doors · Broken Glass · Retrofit Glazing · Hardware · Locks · Maintenance
    </text>
  </svg>`;

  await sharp(Buffer.from(ogSvg))
    .resize(1200, 630)
    .png({ compressionLevel: 9 })
    .toFile(resolve('public/og-image.png'));
  console.log('Wrote public/og-image.png');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
