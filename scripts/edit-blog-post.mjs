#!/usr/bin/env node
/**
 * Edit ONE exact snippet of a published blog post (decision tn-backlink).
 *
 * Usage (normally from .github/workflows/editar-post-publicado.yml):
 *   node scripts/edit-blog-post.mjs show  <slug>              # print the field, numbered by block
 *   node scripts/edit-blog-post.mjs dry   edits/<name>.json   # simulate: before/after, writes nothing
 *   node scripts/edit-blog-post.mjs apply edits/<name>.json   # PATCH the one field, then re-read
 *
 * Edit file: { "slug", "field": "content"|"excerpt"|"meta_description",
 *              "find": "<exact text, must occur exactly once>",
 *              "replace": "<new text>", "reason": "<why>" }
 * Cover swap: { "slug", "field": "featured_image_url", "set": "https://truenorthbusinessloan.ca/blog-images/<name>.png|jpg",
 *               "reason": "<why>" }  (sets that one column; the image file must already be deployed from public/blog-images/)
 *
 * Safety: refuses if `find` occurs 0 or 2+ times; if `replace` is already in the field it
 * reports "already applied" and exits 0 (re-runnable, even when replace contains find).
 * Only the chosen field and updated_at are written. Nothing is deleted.
 *
 * Env: SUPABASE_SERVICE_ROLE_KEY (secret), SUPABASE_URL (optional).
 */
import { readFileSync } from 'node:fs';

const ALLOWED_FIELDS = ['content', 'excerpt', 'meta_description'];
const COVER_FIELD = 'featured_image_url';
const COVER_URL = /^https:\/\/truenorthbusinessloan\.ca\/blog-images\/[a-z0-9-]+\.(png|jpg)$/;
const URL_OK = 'https://kgwcogltpsmapxnjzjhm.supabase.co';

export function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  let n = 0, i = 0;
  while ((i = haystack.indexOf(needle, i)) !== -1) { n++; i += needle.length; }
  return n;
}

/** Pure planning step: returns {status, next?, at?, message}. */
export function planEdit(current, edit) {
  if (edit.field === COVER_FIELD) {
    if (current === edit.set) return { status: 'already', message: 'Already applied: the cover URL is already set.' };
    return { status: 'ok', at: 0, next: edit.set, message: 'Cover URL will be replaced.' };
  }
  const hits = countOccurrences(current, edit.find);
  const already = edit.replace && current.includes(edit.replace);
  if (already) return { status: 'already', message: 'Already applied: `replace` is already in the field.' };
  if (hits === 0) return { status: 'error', message: '`find` was not found in the field.' };
  if (hits > 1) return { status: 'error', message: `\`find\` occurs ${hits} times; it must occur exactly once.` };
  const at = current.indexOf(edit.find);
  const next = current.slice(0, at) + edit.replace + current.slice(at + edit.find.length);
  return { status: 'ok', at, next, message: 'One exact match; edit is safe to apply.' };
}

export function validateEdit(edit) {
  const errs = [];
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(edit.slug || '')) errs.push('slug must be kebab-case');
  if (edit.field === COVER_FIELD) {
    if (!COVER_URL.test(edit.set || '')) errs.push('set must be https://truenorthbusinessloan.ca/blog-images/<name>.png|jpg');
    return errs;
  }
  if (!ALLOWED_FIELDS.includes(edit.field || 'content')) errs.push(`field must be one of ${[...ALLOWED_FIELDS, COVER_FIELD].join(', ')}`);
  if (typeof edit.find !== 'string' || edit.find.length < 20) errs.push('find must be a string of at least 20 characters');
  if (typeof edit.replace !== 'string') errs.push('replace must be a string');
  if (edit.find === edit.replace) errs.push('find and replace are identical');
  if (/<\s*script|javascript:|\bon\w+\s*=/i.test(edit.replace || '')) errs.push('replace contains script/handler markup');
  return errs;
}

function context(text, at, len, pad = 220) {
  const a = Math.max(0, at - pad), b = Math.min(text.length, at + len + pad);
  return (a > 0 ? '…' : '') + text.slice(a, b) + (b < text.length ? '…' : '');
}

async function main() {
  const [mode, arg] = process.argv.slice(2);
  if (!['show', 'dry', 'apply'].includes(mode) || !arg) {
    console.error('Usage: edit-blog-post.mjs show <slug> | dry <edit.json> | apply <edit.json>');
    process.exit(1);
  }
  const SUPABASE_URL = process.env.SUPABASE_URL || URL_OK;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (SUPABASE_URL !== URL_OK) { console.error(`Unexpected SUPABASE_URL (${SUPABASE_URL}); refusing.`); process.exit(1); }
  if (!KEY) { console.error('Missing SUPABASE_SERVICE_ROLE_KEY.'); process.exit(1); }
  const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };
  const API = `${SUPABASE_URL}/rest/v1/blog_posts`;

  const fetchPost = async (slug, field) => {
    const r = await fetch(`${API}?slug=eq.${encodeURIComponent(slug)}&select=id,slug,status,${field}`, { headers: H });
    if (!r.ok) throw new Error(`GET failed: ${r.status} ${await r.text()}`);
    const rows = await r.json();
    if (rows.length !== 1) throw new Error(`Expected 1 post with slug ${slug}, got ${rows.length}`);
    return rows[0];
  };

  if (mode === 'show') {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(arg)) { console.error('Pass a kebab-case slug.'); process.exit(1); }
    const post = await fetchPost(arg, 'content');
    console.log(`slug=${post.slug} status=${post.status} length=${post.content.length}`);
    const blocks = post.content.split(/(?=<(?:h[1-6]|p|ul|ol|table|figure|div|blockquote)[\s>])/i);
    blocks.forEach((b, i) => console.log(`--- [${i}] ---\n${b.trim()}`));
    return;
  }

  if (!/^edits\/[a-z0-9-]+\.json$/.test(arg)) { console.error('Pass edits/<name>.json'); process.exit(1); }
  const edit = JSON.parse(readFileSync(arg, 'utf8'));
  edit.field = edit.field || 'content';
  const errs = validateEdit(edit);
  if (errs.length) { console.error('Invalid edit file:\n- ' + errs.join('\n- ')); process.exit(1); }

  const post = await fetchPost(edit.slug, edit.field);
  const current = post[edit.field] || '';
  console.log(`slug=${post.slug} status=${post.status} field=${edit.field} reason=${edit.reason || '-'}`);
  const plan = planEdit(current, edit);
  console.log(plan.message);
  if (plan.status === 'already') return;
  if (plan.status === 'error') process.exit(1);

  if (edit.field === COVER_FIELD) {
    console.log(`\n== BEFORE ==\n${current || '(empty)'}\n\n== AFTER ==\n${plan.next}`);
  } else {
    console.log('\n== BEFORE ==\n' + context(current, plan.at, edit.find.length));
    console.log('\n== AFTER ==\n' + context(plan.next, plan.at, edit.replace.length));
    console.log(`\nLength: ${current.length} -> ${plan.next.length}`);
  }

  if (mode === 'dry') { console.log('\nDRY RUN: nothing was written.'); return; }

  const r = await fetch(`${API}?id=eq.${post.id}`, {
    method: 'PATCH',
    headers: { ...H, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ [edit.field]: plan.next, updated_at: new Date().toISOString() }),
  });
  if (!r.ok) { console.error(`PATCH failed: ${r.status} ${await r.text()}`); process.exit(1); }
  const after = await fetchPost(edit.slug, edit.field);
  if (after[edit.field] !== plan.next) { console.error('Re-read does not match the planned text.'); process.exit(1); }
  console.log('\nAPPLIED and verified by re-reading. Merge the edit branch (or trigger a Netlify deploy) so the prerendered page catches up.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e.message || e); process.exit(1); });
}
