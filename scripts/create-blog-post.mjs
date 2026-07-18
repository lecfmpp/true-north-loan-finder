#!/usr/bin/env node
/**
 * Create or update a blog post in the Supabase `blog_posts` table.
 *
 * Usage:
 *   node scripts/create-blog-post.mjs ./drafts/my-post.json
 *   node scripts/create-blog-post.mjs ./drafts/my-post.json --publish
 *
 * The JSON file must match scripts/blog-post.template.json.
 *
 * Requires a service_role key (RLS blocks anon inserts). Provide it via .env.local
 * (git-ignored) or the environment:
 *   SUPABASE_SERVICE_ROLE_KEY=...
 *   SUPABASE_URL=https://kgwcogltpsmapxnjzjhm.supabase.co   (optional; defaults below)
 *
 * Behavior: upserts on `slug`. `--publish` forces status="published".
 * Without it, the file's own `status` is used ("draft" by default), so you can
 * review a draft before it goes live.
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// Load .env.local if present (no dependency on dotenv).
try {
  const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
  for (const line of env.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* no .env.local — rely on process.env */ }

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kgwcogltpsmapxnjzjhm.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const file = process.argv[2];
const forcePublish = process.argv.includes('--publish');

if (!file) {
  console.error('Usage: node scripts/create-blog-post.mjs <post.json> [--publish]');
  process.exit(1);
}
if (!SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY (RLS blocks anon inserts).');
  console.error('Add it to .env.local (git-ignored) — dashboard → Project Settings → API → service_role.');
  process.exit(1);
}

const post = JSON.parse(readFileSync(file, 'utf8'));

// Minimal validation.
for (const field of ['title', 'slug', 'content']) {
  if (!post[field]) { console.error(`Post is missing required field: ${field}`); process.exit(1); }
}
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug)) {
  console.error(`Slug must be kebab-case: "${post.slug}"`); process.exit(1);
}

const row = {
  title: post.title,
  slug: post.slug,
  excerpt: post.excerpt ?? null,
  content: post.content,
  featured_image_url: post.featured_image_url ?? null,
  author: post.author ?? 'True North Team',
  tags: post.tags ?? null,
  meta_title: post.meta_title ?? null,
  meta_description: post.meta_description ?? null,
  meta_keywords: post.meta_keywords ?? null,
  reading_time: post.reading_time ?? null,
  status: forcePublish ? 'published' : (post.status ?? 'draft'),
  updated_at: new Date().toISOString(),
};

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase
  .from('blog_posts')
  .upsert(row, { onConflict: 'slug' })
  .select('id, slug, status')
  .single();

if (error) { console.error('Supabase error:', error.message); process.exit(1); }

console.log(`✓ ${data.status === 'published' ? 'Published' : 'Saved draft'}: ${data.slug} (id ${data.id})`);
if (data.status === 'published') {
  console.log(`  Live at: https://truenorthbusinessloan.ca/blog/${data.slug}`);
  console.log('  Reminder: add this URL to public/sitemap.xml with today\'s lastmod.');
}
