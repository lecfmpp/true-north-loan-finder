#!/usr/bin/env node
/**
 * True North branded concept cover generator (WiseFunnel-style, adapted).
 *
 * Produces a 1200x630 on-brand concept image (navy + forest green + gold, no text-heavy
 * clutter) matching the post's "argument shape". Always writes an SVG (zero deps); also
 * writes a PNG when the optional `sharp` package is installed (preferred for OG images).
 *
 * Usage:
 *   node blog-framework/generate-cover.mjs <config.json> <outDir>
 *
 * config.json shape:
 *   { "type": "spread|versus|steps|bars",
 *     "category": "Business Loans",
 *     "headline": "How to get a small business loan in Canada",
 *     "data": {
 *        spread:  { "lo": "$5K", "hi": "$800K", "label": "Loan range" },
 *        versus:  { "left": {"label":"Matched","value":"24–48h"}, "right": {"label":"Bank","value":"2–6 wks"} },
 *        steps:   ["Define need", "Check fit", "Get matched", "Fund"],
 *        bars:    [ {"label":"MCA","value":90}, {"label":"Term","value":70}, {"label":"Equip","value":80} ]
 *     } }
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const INK = '#2b3a47', GREEN = '#22a15e', GOLD = '#efab4d', PAPER = '#f7f9fb', LINE = '#3d4d5a';
const W = 1200, H = 630;

const cfg = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const outDir = process.argv[3] || '.';
mkdirSync(outDir, { recursive: true });

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Wrap a headline into <tspan> lines (native SVG text — rasterizer-safe, unlike foreignObject).
function wrapHeadline(text, { x = 60, y = 245, maxChars = 20, lineH = 62, size = 52, maxLines = 4 } = {}) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars && cur) { lines.push(cur); cur = w; }
    else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  const shown = lines.slice(0, maxLines);
  const tspans = shown.map((l, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : lineH}">${esc(l)}</tspan>`).join('');
  return `<text x="${x}" y="${y}" fill="#ffffff" font-family="Inter,system-ui,sans-serif" font-size="${size}" font-weight="800">${tspans}</text>`;
}

function dotGrid() {
  let d = '';
  for (let x = 40; x < W; x += 40) for (let y = 40; y < H; y += 40)
    d += `<circle cx="${x}" cy="${y}" r="1.3" fill="#ffffff" opacity="0.05"/>`;
  return d;
}

function diagram() {
  const d = cfg.data || {};
  const cx = 780; // diagram column starts right of text
  if (cfg.type === 'spread') {
    return `
      <text x="${cx}" y="250" fill="#9fb0bd" font-family="Inter,sans-serif" font-size="20" font-weight="600">${esc(d.label || 'Loan range')}</text>
      <rect x="${cx}" y="285" width="360" height="16" rx="8" fill="#1f2c37"/>
      <rect x="${cx}" y="285" width="360" height="16" rx="8" fill="url(#g1)"/>
      <text x="${cx}" y="345" fill="${GREEN}" font-family="Inter,sans-serif" font-size="40" font-weight="800">${esc(d.lo || '$5K')}</text>
      <text x="${cx + 360}" y="345" text-anchor="end" fill="${GOLD}" font-family="Inter,sans-serif" font-size="40" font-weight="800">${esc(d.hi || '$800K')}</text>`;
  }
  if (cfg.type === 'versus') {
    const L = d.left || { label: 'Matched', value: '24–48h' }, R = d.right || { label: 'Bank', value: '2–6 wks' };
    return `
      <rect x="${cx}" y="230" width="170" height="170" rx="16" fill="#12303f" stroke="${GREEN}" stroke-width="3"/>
      <text x="${cx + 85}" y="300" text-anchor="middle" fill="#ffffff" font-family="Inter,sans-serif" font-size="30" font-weight="800">${esc(L.value)}</text>
      <text x="${cx + 85}" y="345" text-anchor="middle" fill="${GREEN}" font-family="Inter,sans-serif" font-size="19" font-weight="600">${esc(L.label)}</text>
      <text x="${cx + 190}" y="330" text-anchor="middle" fill="#6b7b88" font-family="Inter,sans-serif" font-size="24" font-weight="700">vs</text>
      <rect x="${cx + 210}" y="230" width="170" height="170" rx="16" fill="#2a2320" stroke="#5a4a3a" stroke-width="2"/>
      <text x="${cx + 295}" y="300" text-anchor="middle" fill="#c9b8a8" font-family="Inter,sans-serif" font-size="30" font-weight="800">${esc(R.value)}</text>
      <text x="${cx + 295}" y="345" text-anchor="middle" fill="#9a8878" font-family="Inter,sans-serif" font-size="19" font-weight="600">${esc(R.label)}</text>`;
  }
  if (cfg.type === 'steps') {
    const steps = (d.steps || d || ['Define', 'Match', 'Apply', 'Fund']).slice(0, 4);
    let s = '';
    steps.forEach((label, i) => {
      const y = 210 + i * 80;
      s += `<circle cx="${cx + 20}" cy="${y}" r="22" fill="${i === steps.length - 1 ? GOLD : GREEN}"/>
        <text x="${cx + 20}" y="${y + 7}" text-anchor="middle" fill="${INK}" font-family="Inter,sans-serif" font-size="22" font-weight="800">${i + 1}</text>
        <text x="${cx + 58}" y="${y + 7}" fill="#dfe6ec" font-family="Inter,sans-serif" font-size="22" font-weight="600">${esc(label)}</text>`;
      if (i < steps.length - 1) s += `<line x1="${cx + 20}" y1="${y + 22}" x2="${cx + 20}" y2="${y + 58}" stroke="${LINE}" stroke-width="2" stroke-dasharray="4 4"/>`;
    });
    return s;
  }
  // bars
  const bars = (cfg.data?.bars || cfg.data || [{ label: 'A', value: 80 }, { label: 'B', value: 60 }, { label: 'C', value: 95 }]).slice(0, 5);
  const max = Math.max(...bars.map(b => b.value || 0), 1);
  const bw = 60, gap = 34, baseY = 400, maxH = 180;
  let b = '';
  bars.forEach((bar, i) => {
    const h = Math.round(((bar.value || 0) / max) * maxH);
    const x = cx + i * (bw + gap);
    const hi = bar.value === max;
    b += `<rect x="${x}" y="${baseY - h}" width="${bw}" height="${h}" rx="6" fill="${hi ? GOLD : GREEN}"/>
      <text x="${x + bw / 2}" y="${baseY + 28}" text-anchor="middle" fill="#9fb0bd" font-family="Inter,sans-serif" font-size="17" font-weight="600">${esc(bar.label)}</text>`;
  });
  return b;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${GREEN}"/><stop offset="1" stop-color="${GOLD}"/>
    </linearGradient>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#22323e"/><stop offset="1" stop-color="${INK}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${dotGrid()}
  <rect x="60" y="70" width="6" height="52" rx="3" fill="${GREEN}"/>
  <text x="86" y="94" fill="${GOLD}" font-family="Inter,sans-serif" font-size="17" font-weight="700" letter-spacing="2">${esc((cfg.category || 'Business Loans').toUpperCase())}</text>
  <text x="86" y="118" fill="#7d8b97" font-family="Inter,sans-serif" font-size="15" font-weight="600">TRUE NORTH BUSINESS LOAN</text>
  ${wrapHeadline(cfg.headline || '')}
  ${diagram()}
</svg>`;

const svgPath = join(outDir, 'cover.svg');
writeFileSync(svgPath, svg);
console.log('wrote', svgPath);

// Optional PNG (preferred for OG). Only if sharp is installed.
try {
  const sharp = (await import('sharp')).default;
  const pngPath = join(outDir, 'cover.png');
  await sharp(Buffer.from(svg)).png().toFile(pngPath);
  console.log('wrote', pngPath);
} catch {
  console.log('(sharp not installed — SVG only. `npm i -D sharp` for PNG/OG output.)');
}
