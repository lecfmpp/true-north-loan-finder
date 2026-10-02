#!/usr/bin/env node
/**
 * True North cover system v2 — 3 templates rendered with Playwright/Chromium (HTML + CSS).
 * Replaces the single dark "headline + small diagram" look of generate-cover.mjs, which made
 * every post look the same. See blog-framework/covers/README.md for the rotation rule.
 *
 * Usage:
 *   node blog-framework/covers/render-cover.mjs <cover.json> <outDir> [--variant dado|icones|foto|all] [--pick <variant>]
 *
 *   --variant  which template(s) to render (default: all variants present in the config)
 *   --pick     also copy that variant to <outDir>/cover.png (+ cover.jpg for foto) = the one to publish
 *
 * Output: <outDir>/cover-dado.png, cover-icones.png, cover-foto.jpg (all 1200x630).
 * Needs Playwright with Chromium (PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers on the agent machine;
 * locally: `npx playwright install chromium`). Fonts are embedded from ../fonts, so no system fonts.
 *
 * cover.json:
 * {
 *   "category": "Equipment Financing",
 *   "headline": "Equipment lease vs loan in Canada",
 *   "dado":   { "kicker": "...", "value": "$7,200", "label": "...", "footer": "...",
 *               "card": { "title": "...", "rows": [{"label":"Loan","value":"$122K","amount":122095,"color":"green"}], "note": "..." } },
 *   "icones": { "kicker": "...", "sub": "...", "ghost": "forklift",
 *               "tiles": [{"icon":"key-round","title":"Loan","text":"..."}, {"icon":"repeat","title":"Lease","text":"..."}], "vs": true },
 *   "foto":   { "kicker": "...", "photo": "photos/<file>.jpg", "position": "60% 50%", "chip": "...", "chipIcon": "trending-down",
 *               "flip": false, "credit": "Photo: Author / Unsplash" }   // flip mirrors the photo so the subject sits right of the text
 * }
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..');
const VARIANTS = ['dado', 'icones', 'foto'];

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const [cfgPath, outDirArg] = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
if (!cfgPath) { console.error('Usage: render-cover.mjs <cover.json> <outDir> [--variant v|all] [--pick v]'); process.exit(1); }
const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
const outDir = outDirArg || '.';
mkdirSync(outDir, { recursive: true });
const want = flag('--variant') || 'all';
const pick = flag('--pick');
const list = want === 'all' ? VARIANTS.filter((v) => cfg[v]) : [want];

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const b64 = (p, mime) => `data:${mime};base64,${readFileSync(p).toString('base64')}`;
const icon = (name) => {
  const p = join(HERE, 'icons', `${name}.svg`);
  if (!existsSync(p)) throw new Error(`Icon not found: icons/${name}.svg (copy it from the lucide-static npm package)`);
  return readFileSync(p, 'utf8').replace(/<!--.*?-->/s, '').replace(/class="[^"]*"/, '');
};

const FONTS = [['Regular', 400], ['Medium', 500], ['SemiBold', 600], ['Bold', 700], ['ExtraBold', 800]]
  .map(([n, w]) => `@font-face{font-family:'Poppins';font-weight:${w};src:url(${b64(join(ROOT, 'blog-framework/fonts', `Poppins-${n}.ttf`), 'font/ttf')}) format('truetype');}`).join('\n');
const CSS = readFileSync(join(HERE, 'cover.css'), 'utf8');
const MARK = b64(join(ROOT, 'public/lovable-uploads/eae8a3b3-6d86-4fe4-9e17-17b808de0d2e.png'), 'image/png');
const brand = `<div class="brand"><img src="${MARK}" alt=""><span>True North Business Loan</span></div>`;
const COLORS = { green: 'var(--green)', gold: 'var(--gold)', gray: '#8fa1af', navy: '#5d7385' };

function dado(c) {
  const d = c.dado;
  const max = Math.max(...d.card.rows.map((r) => r.amount));
  const min = Math.min(...d.card.rows.map((r) => r.amount));
  const rows = d.card.rows.map((r) => {
    const pct = 55 + ((r.amount - min) / Math.max(max - min, 1)) * 45; // visual range 55–100% so small gaps still read
    return `<div class="row"><div class="meta"><span>${esc(r.label)}</span><em>${esc(r.value)}</em></div>
      <div class="bar"><i style="width:${pct.toFixed(1)}%;background:${COLORS[r.color] || r.color}"></i></div></div>`;
  }).join('');
  return `<div class="cover v-dado">
    <div class="top">${brand}<div class="pill">${esc(c.category)}</div></div>
    <div class="left"><div class="kicker">${esc(d.kicker)}</div>
      <div class="big">${esc(d.value)}</div><div class="label fit" data-max="27" data-h="110">${esc(d.label)}</div></div>
    <div class="card"><h4>${esc(d.card.title)}</h4>${rows}<div class="note">${esc(d.card.note || '')}</div></div>
    <div class="foot">${d.footer ? d.footer : esc(c.headline)}</div>
  </div>`;
}

function icones(c) {
  const d = c.icones;
  const tiles = d.tiles.slice(0, 3).map((t, i) => `<div class="tile t${i}"><div class="ic">${icon(t.icon)}</div>
    <div><h5>${esc(t.title)}</h5><p>${esc(t.text)}</p></div></div>`).join('');
  return `<div class="cover v-icones"><div class="rings"></div>
    ${d.ghost ? `<div class="ghost">${icon(d.ghost)}</div>` : ''}
    ${brand}
    <div class="left"><div class="kicker">${esc(d.kicker || c.category)}</div>
      <div class="headline fit" data-max="58" data-h="280">${esc(d.headline || c.headline)}</div>
      ${d.sub ? `<div class="sub">${esc(d.sub)}</div>` : ''}</div>
    <div class="tiles">${tiles}</div>
    ${d.vs && d.tiles.length === 2 ? '<div class="vs" id="vs">VS</div>' : ''}
  </div>`;
}

function foto(c) {
  const d = c.foto;
  const photo = resolve(HERE, d.photo);
  return `<div class="cover v-foto">
    <img class="photo" src="${b64(photo, 'image/jpeg')}" style="object-position:${esc(d.position || '50% 50%')}${d.flip ? ';transform:scaleX(-1)' : ''}" alt="">
    <div class="shade"></div><div class="rail"></div>
    ${brand}
    <div class="left"><div class="kicker">${esc(d.kicker || c.category)}</div>
      <div class="headline fit" data-max="64" data-h="300">${esc(d.headline || c.headline)}</div>
      ${d.chip ? `<div class="chip">${d.chipIcon ? icon(d.chipIcon) : ''}<span>${esc(d.chip)}</span></div>` : ''}</div>
    ${d.credit ? `<div class="credit">${esc(d.credit)}</div>` : ''}
  </div>`;
}

const page = (body) => `<!doctype html><html><head><meta charset="utf-8"><style>${FONTS}\n${CSS}</style></head><body>${body}
<script>
  // Shrink-to-fit: .fit elements step down from data-max px until they fit in data-h px.
  document.querySelectorAll('.fit').forEach((el) => {
    let s = +el.dataset.max; el.style.fontSize = s + 'px';
    while (el.scrollHeight > +el.dataset.h && s > 18) { s -= 1; el.style.fontSize = s + 'px'; }
  });
  // Centre the VS badge between the two tiles.
  const vs = document.getElementById('vs');
  if (vs) { const t = document.querySelectorAll('.tile'); const a = t[0].getBoundingClientRect(), b = t[1].getBoundingClientRect();
    vs.style.top = ((a.bottom + b.top) / 2 - 29) + 'px'; vs.style.right = (1200 - a.left - 29 - 60) + 'px'; }
</script></body></html>`;

async function loadPlaywright() {
  try { return await import('playwright'); } catch {}
  try { const g = execSync('npm root -g').toString().trim(); return createRequire(join(g, 'noop.js'))('playwright'); }
  catch { console.error('Playwright not found. Install it (npm i -g playwright && npx playwright install chromium).'); process.exit(1); }
}

const { chromium } = await loadPlaywright();
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
const render = { dado, icones, foto };
for (const v of list) {
  if (!cfg[v]) { console.error(`config has no "${v}" block`); continue; }
  const p = await ctx.newPage();
  await p.setContent(page(render[v](cfg)), { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  // Photo covers ship as JPEG (a PNG of a photo is ~7x bigger); flat covers ship as PNG.
  const out = join(outDir, `cover-${v}.${v === 'foto' ? 'jpg' : 'png'}`);
  await p.screenshot(v === 'foto' ? { path: out, type: 'jpeg', quality: 86 } : { path: out, type: 'png' });
  console.log('wrote', out);
  await p.close();
}
await browser.close();

if (pick) {
  if (!VARIANTS.includes(pick)) { console.error('--pick must be one of', VARIANTS.join(', ')); process.exit(1); }
  if (pick === 'foto') { copyFileSync(join(outDir, 'cover-foto.jpg'), join(outDir, 'cover.jpg')); console.log('picked foto -> cover.jpg'); }
  else { copyFileSync(join(outDir, `cover-${pick}.png`), join(outDir, 'cover.png')); console.log(`picked ${pick} -> cover.png`); }
}
