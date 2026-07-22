#!/usr/bin/env node
/**
 * Read-only conformance check for published blog content.
 *
 * Why this exists: the blog element standard, the Canada-only positioning and
 * the "no CTA in content" rule all live in the database, not in the repo, so
 * nothing in CI could catch a regression. A bad daily post, or a hand edit in
 * the Supabase dashboard, would only be noticed by eye.
 *
 * Safety: this reads with the public anon key, which RLS restricts to published
 * posts — exactly the scope this needs. It never uses the service_role key, and
 * it pins the project ref so it cannot silently run against a different
 * Supabase project.
 *
 *   node scripts/check-blog-content.mjs
 *
 * Exit 0 = conformant (warnings allowed). Exit 1 = a hard rule was broken.
 */

const EXPECTED_REF = process.env.SUPABASE_PROJECT_REF || 'kgwcogltpsmapxnjzjhm';
const SUPABASE_URL = process.env.SUPABASE_URL || `https://${EXPECTED_REF}.supabase.co`;
const ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd2NvZ2x0cHNtYXB4bmp6amhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNTI5MjAsImV4cCI6MjA2NzkyODkyMH0.zTQ6IUFqaSOiTNuEMVbIoqIKIPCbLT9GgPvsnTtYVEI';

// Guard against pointing at the wrong project — the whole reason this moved
// out of an interactive connector and into version control.
const urlRef = (SUPABASE_URL.match(/https:\/\/([a-z0-9]+)\.supabase\.co/) || [])[1];
if (urlRef !== EXPECTED_REF) {
  console.error(`Refusing to run: SUPABASE_URL points at "${urlRef}" but this repo expects "${EXPECTED_REF}".`);
  process.exit(1);
}
console.log(`Checking published blog content in Supabase project ${EXPECTED_REF}.`);

const res = await fetch(
  `${SUPABASE_URL}/rest/v1/blog_posts?select=slug,title,content,excerpt,meta_title,meta_description,reading_time,status&status=eq.published`,
  { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } },
);
if (!res.ok) {
  console.error(`Could not read blog_posts: ${res.status} ${res.statusText}`);
  process.exit(1);
}
const posts = await res.json();
if (!Array.isArray(posts) || posts.length === 0) {
  console.error('No published posts returned — the anon read path is broken, which would also break the prerender.');
  process.exit(1);
}

const errors = [];
const warnings = [];
const isText = (v) => typeof v === 'string' && v.trim() !== '';

// Duplicate slugs would break the daily pipeline's own duplicate guard.
const seen = new Map();
for (const p of posts) {
  if (seen.has(p.slug)) errors.push(`duplicate slug: ${p.slug}`);
  seen.set(p.slug, true);
}

for (const p of posts) {
  const c = String(p.content || '');
  const at = (msg) => `${p.slug}: ${msg}`;

  // --- hard rules: these are regressions, and each has bitten this project ---
  if (!isText(p.title)) errors.push(at('missing title'));
  if (!isText(c)) errors.push(at('missing content'));
  if (!isText(p.excerpt)) errors.push(at('missing excerpt (used on /blog cards and as meta fallback)'));
  if (!isText(p.meta_description)) errors.push(at('empty meta_description'));
  if (!Number.isInteger(p.reading_time) || p.reading_time <= 0) {
    errors.push(at(`reading_time is ${JSON.stringify(p.reading_time)}, expected a positive integer`));
  }
  // BlogPost.tsx renders its own CTA and its own <h1>; duplicates in content
  // produced two stacked CTA banners and two H1s on the page.
  if (/tn-cta|cta-button/i.test(c)) errors.push(at('contains a CTA block — the page already renders one'));
  if (/<h1[\s>]/i.test(c)) errors.push(at('contains an <h1> — the page already renders the title as H1'));
  // Inline styles fight the left-alignment rules and bypass the element standard.
  if (/\sstyle\s*=/i.test(c)) errors.push(at('inline style attributes — use the tn-* classes'));
  if (/<table/i.test(c) && !/tn-table-wrap/.test(c)) errors.push(at('a <table> is not wrapped in tn-table-wrap (overflows on mobile)'));

  // --- soft rules: worth seeing, not worth blocking ---
  if (isText(p.meta_title) && p.meta_title.length > 60) {
    warnings.push(at(`meta_title is ${p.meta_title.length} chars (Google truncates near 60)`));
  }
  if (isText(p.meta_description) && p.meta_description.length > 160) {
    warnings.push(at(`meta_description is ${p.meta_description.length} chars`));
  }
  if (/united states|north america/i.test(c)) {
    warnings.push(at('mentions the US / North America — intentional only where the regulation itself is American'));
  }
  if (!/class="tn-/.test(c)) warnings.push(at('uses none of the tn-* visual elements'));
}

console.log(`\nChecked ${posts.length} published posts.`);
if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`  ::warning::${w}`);
}
if (errors.length) {
  console.log(`\n${errors.length} error(s):`);
  for (const e of errors) console.log(`  ::error::${e}`);
  console.error('\nBlog content check FAILED.');
  process.exit(1);
}
console.log('\nBlog content check passed.');
