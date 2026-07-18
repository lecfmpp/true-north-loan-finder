#!/usr/bin/env node
/**
 * Autonomous daily blog post: generate -> QA -> publish to Supabase -> update sitemap.
 * Designed to run in GitHub Actions (real network access; secrets from repo settings).
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY, GEMINI_MODEL,
 *      FORCE_TOPIC (optional), DRY_RUN ('true' to skip publishing)
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kgwcogltpsmapxnjzjhm.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const DRY = String(process.env.DRY_RUN).toLowerCase() === 'true';

if (!SERVICE_KEY) { console.error('Missing SUPABASE_SERVICE_ROLE_KEY secret.'); process.exit(1); }
if (!GEMINI_KEY) { console.error('Missing GEMINI_API_KEY secret.'); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

/* ---------- 1. Duplicate check ---------- */
const { data: existing, error: exErr } = await supabase
  .from('blog_posts').select('slug,title').order('created_at', { ascending: false }).limit(300);
if (exErr) { console.error('Could not read blog_posts:', exErr.message); process.exit(1); }
const taken = new Set((existing || []).map(p => p.slug));
console.log(`Existing posts: ${taken.size}`);

/* ---------- 2. Topic pool (rotates; excludes anything already published) ---------- */
const POOL = [
  ['equipment financing canada', 'Equipment Financing in Canada: How to Qualify and What It Costs', 'spread'],
  ['merchant cash advance canada', 'Merchant Cash Advance in Canada: Costs, Pros, and When It Fits', 'versus'],
  ['invoice factoring canada', 'Invoice Factoring in Canada: Turn Unpaid Invoices Into Cash', 'steps'],
  ['business loan bad credit canada', 'How to Get a Business Loan With Bad Credit in Canada', 'bars'],
  ['trucking business loans', 'Trucking Business Loans: Financing Trucks, Trailers and Fuel', 'spread'],
  ['manufacturing equipment loans', 'Manufacturing Equipment Loans: How to Finance Your Production Line', 'steps'],
  ['self storage business loans', 'Self-Storage Business Loans: Financing Expansion and Acquisition', 'spread'],
  ['restaurant business loan canada', 'Restaurant Business Loans in Canada: What Lenders Look For', 'bars'],
  ['working capital loan small business', 'Working Capital Loans: When to Use One and How to Qualify', 'versus'],
  ['business line of credit vs term loan', 'Business Line of Credit vs Term Loan: Which Should You Choose?', 'versus'],
  ['franchise financing canada', 'Franchise Financing in Canada: Funding an Established Franchise', 'steps'],
  ['business loan requirements canada', 'Business Loan Requirements in Canada: The Complete Checklist', 'steps'],
  ['how fast business loan approval', 'How Fast Can You Get a Business Loan? Approval and Funding Timelines', 'bars'],
  ['bank vs alternative lender business loan', 'Bank vs Alternative Lender: Which Business Loan Is Right for You?', 'versus'],
];
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
let choice = null;
if (process.env.FORCE_TOPIC) {
  choice = [process.env.FORCE_TOPIC, process.env.FORCE_TOPIC, 'spread'];
} else {
  const dayIdx = Math.floor(Date.now() / 86400000) % POOL.length;
  for (let i = 0; i < POOL.length; i++) {
    const cand = POOL[(dayIdx + i) % POOL.length];
    if (!taken.has(slugify(cand[1]))) { choice = cand; break; }
  }
}
if (!choice) { console.log('All pooled topics are published. Add more to POOL. Exiting cleanly.'); process.exit(0); }
const [focusKeyword, workingTitle, coverType] = choice;
const slug = slugify(workingTitle);
console.log(`Topic: ${workingTitle}  (slug: ${slug})`);

/* ---------- 3. Generate the post with Gemini, constrained by the framework ---------- */
const framework = existsSync('blog-framework/BLOG-FRAMEWORK.md')
  ? readFileSync('blog-framework/BLOG-FRAMEWORK.md', 'utf8') : '';

const prompt = `You are the True North Authority Architect, a senior SEO/AEO content strategist for
True North Business Loan — a service that matches Canadian and US small businesses with business
loan offers of $5,000 to $800,000 via a 60-second loan estimator quiz, with approvals in 24-48 hours.

Write ONE blog post. Focus keyword: "${focusKeyword}". Working title: "${workingTitle}".

FOLLOW THIS FRAMEWORK STRICTLY:
${framework.slice(0, 9000)}

HARD RULES:
- Return ONLY valid minified JSON, no markdown fences, matching exactly this shape:
  {"title","slug","excerpt","content","tags":[],"meta_title","meta_description","meta_keywords":[],"reading_time"}
- "slug" MUST be exactly "${slug}".
- "content" is sanitized HTML (no <script>, no <style>, no markdown). Use <h2>/<h3>/<p>/<ul>/<li>/<strong>/<a>.
- Use inline style attributes for structured elements (key-takeaway box, numbered steps, comparison
  table, note callout, FAQ via <details>, and one CTA block) using these brand colours:
  ink #2b3a47, green #22a15e, gold #efab4d, paper #f7f9fb, line #e5e8ec, muted #6f757b.
- H2 headings are sentence case and phrased as questions. Answer each in the first 1-2 sentences.
- Max ~20 words per sentence. No emoji anywhere.
- Include 4-6 FAQ pairs using <details><summary>.
- Include EXACTLY ONE call-to-action block linking to /loan-estimator, placed last.
- Include 2-3 internal links from: /loan-estimator, /small-business-loans, /equipment-financing,
  /merchant-cash-advance, /invoice-factoring, /how-it-works.
- meta_title <= 60 chars. meta_description <= 160 chars.
- 900-1400 words. Evergreen and factual. NEVER invent a specific interest rate, statistic, or a
  named lender. Do not give personalised financial advice.`;

const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192, responseMimeType: 'application/json' },
    }),
  }
);
if (!res.ok) { console.error('Gemini error', res.status, (await res.text()).slice(0, 500)); process.exit(1); }
const payload = await res.json();
const raw = payload?.candidates?.[0]?.content?.parts?.[0]?.text || '';
let post;
try { post = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, '').trim()); }
catch { console.error('Gemini did not return valid JSON:', raw.slice(0, 600)); process.exit(1); }

post.slug = slug;
post.author = 'True North Team';
post.status = 'published';

/* ---------- 4. QA gate ---------- */
const fail = [];
if (!post.title || !post.content || !post.excerpt) fail.push('missing title/content/excerpt');
if ((post.meta_title || '').length > 60) fail.push('meta_title > 60');
if ((post.meta_description || '').length > 160) fail.push('meta_description > 160');
if (!/loan-estimator/.test(post.content)) fail.push('no CTA to /loan-estimator');
if (/<script|<style/i.test(post.content)) fail.push('contains script/style');
if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(post.content)) fail.push('contains emoji');
if ((post.content.match(/<h2/g) || []).length < 4) fail.push('fewer than 4 H2 sections');
if (!/<details/.test(post.content)) fail.push('no FAQ block');
if (taken.has(post.slug)) fail.push('duplicate slug');
if (fail.length) { console.error('QA gate FAILED:', fail.join('; ')); process.exit(1); }
console.log('QA gate passed.');

/* ---------- 5. Cover image ---------- */
const dir = `drafts/${slug}`;
mkdirSync(dir, { recursive: true });
let coverUrl = null;
try {
  const cfg = `${dir}/cover.config.json`;
  writeFileSync(cfg, JSON.stringify({
    type: coverType, category: 'Business Loans', headline: post.title.replace(/\s*[:(].*$/, ''),
    data: coverType === 'spread' ? { label: 'What you can borrow', lo: '$5K', hi: '$800K' }
      : coverType === 'versus' ? { left: { label: 'Matched', value: '24-48h' }, right: { label: 'Bank', value: '2-6 wks' } }
      : coverType === 'steps' ? { steps: ['Define need', 'Check fit', 'Get matched', 'Fund'] }
      : { bars: [{ label: 'MCA', value: 95 }, { label: 'Equip', value: 80 }, { label: 'Term', value: 65 }] },
  }));
  execFileSync('node', ['blog-framework/generate-cover.mjs', cfg, dir], { stdio: 'inherit' });
  const img = existsSync(`${dir}/cover.png`) ? `${dir}/cover.png` : `${dir}/cover.svg`;
  const ext = img.endsWith('.png') ? 'png' : 'svg';
  const { error: upErr } = await supabase.storage.from('blog-images')
    .upload(`covers/${slug}-cover.${ext}`, readFileSync(img), {
      contentType: ext === 'png' ? 'image/png' : 'image/svg+xml', upsert: true });
  if (upErr) console.warn('Cover upload skipped:', upErr.message);
  else coverUrl = supabase.storage.from('blog-images').getPublicUrl(`covers/${slug}-cover.${ext}`).data.publicUrl;
} catch (e) { console.warn('Cover step skipped:', e.message); }
post.featured_image_url = coverUrl;

/* ---------- 6. Publish ---------- */
if (DRY) {
  writeFileSync(`${dir}/post.json`, JSON.stringify(post, null, 2));
  console.log(`DRY RUN — post written to ${dir}/post.json, not published.`);
  process.exit(0);
}
const { data: inserted, error: insErr } = await supabase
  .from('blog_posts')
  .upsert({ ...post, updated_at: new Date().toISOString() }, { onConflict: 'slug' })
  .select('id,slug,status').single();
if (insErr) { console.error('Publish failed:', insErr.message); process.exit(1); }
console.log(`Published: https://truenorthbusinessloan.ca/blog/${inserted.slug}`);

/* ---------- 7. Sitemap + log ---------- */
try {
  const sp = 'public/sitemap.xml';
  if (existsSync(sp)) {
    const xml = readFileSync(sp, 'utf8');
    const loc = `https://truenorthbusinessloan.ca/blog/${slug}`;
    if (!xml.includes(loc)) {
      const today = new Date().toISOString().slice(0, 10);
      writeFileSync(sp, xml.replace('</urlset>',
        `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n</urlset>`));
      console.log('Sitemap updated.');
    }
  }
  const logPath = 'blog-framework/published-log.md';
  if (existsSync(logPath)) {
    const line = `${new Date().toISOString().slice(0, 10)} | ${slug} | ${focusKeyword} | published\n`;
    writeFileSync(logPath, readFileSync(logPath, 'utf8').replace(/\n*$/, '\n') + line);
  }
} catch (e) { console.warn('Sitemap/log step skipped:', e.message); }
