#!/usr/bin/env node
/**
 * Upload a generated cover to Supabase Storage (bucket: blog-images) and print its public URL.
 * Requires SUPABASE_SERVICE_ROLE_KEY (in .env.local). Prefers PNG, falls back to SVG.
 *
 * Usage: node blog-framework/upload-cover.mjs <slug> <coverDir>
 *   -> prints the public URL on the last line (use it as featured_image_url / og_image_url)
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

try {
  const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
  for (const line of env.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}

const URL_ = process.env.SUPABASE_URL || 'https://kgwcogltpsmapxnjzjhm.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const slug = process.argv[2];
const dir = process.argv[3];
if (!slug || !dir) { console.error('Usage: upload-cover.mjs <slug> <coverDir>'); process.exit(1); }
if (!KEY) { console.error('Missing SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }

const png = join(dir, 'cover.png'), svg = join(dir, 'cover.svg');
const usePng = existsSync(png);
const file = usePng ? png : svg;
if (!existsSync(file)) { console.error('No cover.png/svg in', dir); process.exit(1); }

const supabase = createClient(URL_, KEY, { auth: { persistSession: false } });
const bucket = 'blog-images';
const path = `covers/${slug}-cover.${usePng ? 'png' : 'svg'}`;
const body = readFileSync(file);

const { error } = await supabase.storage.from(bucket).upload(path, body, {
  contentType: usePng ? 'image/png' : 'image/svg+xml',
  upsert: true,
});
if (error) { console.error('Upload failed:', error.message); process.exit(1); }
const { data } = supabase.storage.from(bucket).getPublicUrl(path);
console.log(data.publicUrl);
