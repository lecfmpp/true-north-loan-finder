/**
 * Static pre-rendering (SSG).
 *
 * Runs after `vite build` + `vite build --ssr` and writes a real HTML file for
 * every public route, so crawlers and AI answer engines that don't execute
 * JavaScript still see the page content instead of an empty <div id="root">.
 *
 * Routes are listed explicitly below — they must match src/App.tsx. They are
 * NOT derived from filenames in src/pages, because filenames and URLs differ
 * (BlogPost.tsx serves /blog/:slug, CanadianApplication.tsx serves
 * /application-canadian, and so on).
 */
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const toAbsolute = (p) => path.resolve(__dirname, p)

// Public, indexable routes. Deliberately excluded: parameterised or
// user-specific routes (/results/:responseId, /application-status),
// authenticated routes (/auth), and post-conversion confirmation pages
// (/application-success, /broker-payment-success) — none should be indexed.
const STATIC_ROUTES = [
  '/',
  '/loan-estimator',
  '/how-it-works',
  '/about',
  '/partners',
  '/industries-we-serve',
  '/blog',
  '/equipment-financing',
  '/small-business-loans',
  '/merchant-cash-advance',
  '/invoice-factoring',
  '/established-franchises',
  '/transportation',
  '/manufacturing',
  '/property-management',
  '/self-storage',
  '/cannabis-dispensary',
  '/compare',
  '/application-usa',
  '/application-canadian',
  '/broker-signup',
  '/privacy',
  '/terms',
]

/**
 * Published blog slugs, read from Supabase at build time.
 *
 * Uses the public anon key: RLS already restricts anonymous SELECT to
 * status = 'published', which is exactly the set we want. No service_role key
 * is needed here, and none should ever be added — this runs in the site build.
 *
 * If Supabase is unreachable we log and continue with the static routes rather
 * than failing the whole deploy over blog HTML.
 */
async function fetchBlogSlugs() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !anonKey) {
    console.warn('  ! VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY not set — skipping blog routes.')
    return { ok: false, posts: [] }
  }

  try {
    const endpoint =
      `${supabaseUrl}/rest/v1/blog_posts` +
      `?select=slug,updated_at&status=eq.published&order=updated_at.desc`
    const res = await fetch(endpoint, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    })
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    const rows = await res.json()
    return {
      ok: true,
      posts: rows.filter((r) => r.slug).map((r) => ({ slug: r.slug, updatedAt: r.updated_at })),
    }
  } catch (err) {
    console.warn(`  ! Could not fetch blog posts (${err.message}) — skipping blog routes.`)
    return { ok: false, posts: [] }
  }
}

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const ORIGIN = 'https://truenorthbusinessloan.ca'

/** Absolute canonical URL for a route (no trailing slash, per site convention). */
const canonicalFor = (route) => (route === '/' ? ORIGIN : `${ORIGIN}${route}`)

/**
 * Fold per-page metadata into the template's <head>.
 *
 * index.html ships a generic title/description/canonical/og set for the home
 * page. Left alone, every pre-rendered page would repeat it, so the managed
 * tags are stripped and replaced with the ones SEOHead resolved for this route.
 * (This also fixes index.html declaring rel="canonical" twice.)
 *
 * The canonical is ALWAYS rewritten to this route's own URL, even for pages
 * that render no <SEOHead>. Otherwise those pages would inherit index.html's
 * canonical (the homepage), telling search engines they duplicate the home
 * page — worse than having no canonical at all.
 */
function applyHead(template, head, route) {
  const canonicalUrl = head?.canonicalUrl || canonicalFor(route)

  // Always strip the template's canonical (and the eager duplicate) and
  // re-add exactly one pointing at this route.
  let html = template.replace(/<link\s+rel="canonical"[^>]*>\s*/gi, '')

  // The remaining managed tags are only replaced when SEOHead gave us values;
  // without it we keep index.html's generic title/description as a fallback.
  const tags = [`<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`]

  if (!head) {
    return html.replace('</head>', `    ${tags.join('\n    ')}\n  </head>`)
  }

  const managed = [
    /<title>[\s\S]*?<\/title>\s*/gi,
    /<meta\s+name="description"[^>]*>\s*/gi,
    /<meta\s+name="keywords"[^>]*>\s*/gi,
    /<meta\s+property="og:(?:title|description|type|image|url)"[^>]*>\s*/gi,
    /<meta\s+name="twitter:(?:title|description|image|card)"[^>]*>\s*/gi,
  ]
  for (const pattern of managed) html = html.replace(pattern, '')

  tags.push(
    `<title>${escapeHtml(head.title)}</title>`,
    `<meta name="description" content="${escapeHtml(head.description)}" />`,
    `<meta name="keywords" content="${escapeHtml((head.keywords || []).join(', '))}" />`,
    `<meta property="og:title" content="${escapeHtml(head.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(head.description)}" />`,
    `<meta property="og:type" content="${escapeHtml(head.ogType)}" />`,
    `<meta property="og:image" content="${escapeHtml(head.ogImage)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(head.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(head.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(head.ogImage)}" />`,
  )

  if (head.article && head.ogType === 'article') {
    const a = head.article
    if (a.author) tags.push(`<meta property="article:author" content="${escapeHtml(a.author)}" />`)
    if (a.publishedTime)
      tags.push(`<meta property="article:published_time" content="${escapeHtml(a.publishedTime)}" />`)
    if (a.modifiedTime)
      tags.push(`<meta property="article:modified_time" content="${escapeHtml(a.modifiedTime)}" />`)
    if (a.section) tags.push(`<meta property="article:section" content="${escapeHtml(a.section)}" />`)
    for (const tag of a.tags || [])
      tags.push(`<meta property="article:tag" content="${escapeHtml(tag)}" />`)
  }

  if (head.structuredData) {
    // </script> inside JSON would close the tag early.
    const json = JSON.stringify(head.structuredData).replace(/</g, '\\u003c')
    tags.push(`<script type="application/ld+json">${json}</script>`)
  }

  return html.replace('</head>', `    ${tags.join('\n    ')}\n  </head>`)
}

/** Write dist/<route>/index.html, creating parent directories as needed. */
function writeRoute(route, html) {
  const filePath = route === '/' ? 'dist/index.html' : `dist${route}/index.html`
  const absolute = toAbsolute(filePath)
  fs.mkdirSync(path.dirname(absolute), { recursive: true })
  fs.writeFileSync(absolute, html)
  return filePath
}

/**
 * Regenerate sitemap.xml in dist/ so blog posts are included.
 * public/sitemap.xml remains the hand-maintained source for static routes;
 * this rewrites it at build time with the Supabase-backed blog URLs added.
 */
function writeSitemap(routes, blogPosts) {
  const today = new Date().toISOString().slice(0, 10)
  const lastmodFor = new Map(
    blogPosts.map((p) => [`/blog/${p.slug}`, (p.updatedAt || '').slice(0, 10) || today]),
  )

  const urls = routes
    .map((route) => {
      const loc = canonicalFor(route)
      const lastmod = lastmodFor.get(route) || today
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`
    })
    .join('\n')

  fs.writeFileSync(
    toAbsolute('dist/sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  )
  console.log(`  ✓ sitemap.xml (${routes.length} URLs)`)
}

/**
 * Read the pristine index.html template.
 *
 * The home page is written back to dist/index.html, which replaces the
 * <!--app-html--> placeholder — so re-reading that file on a second run would
 * yield a template with nowhere to inject. We snapshot the pristine copy into
 * dist/server/ on first run and prefer it afterwards. `vite build --ssr`
 * empties dist/server/ on every full build, so the snapshot can't go stale.
 */
function readTemplate() {
  const snapshotPath = toAbsolute('dist/server/index.template.html')

  if (fs.existsSync(snapshotPath)) {
    return fs.readFileSync(snapshotPath, 'utf-8')
  }

  const template = fs.readFileSync(toAbsolute('dist/index.html'), 'utf-8')
  if (!template.includes('<!--app-html-->')) {
    throw new Error(
      'dist/index.html has no <!--app-html--> placeholder and no pristine ' +
        'snapshot exists. Run the full `npm run build` rather than `npm run prerender` alone.',
    )
  }

  fs.mkdirSync(path.dirname(snapshotPath), { recursive: true })
  fs.writeFileSync(snapshotPath, template)
  return template
}

async function main() {
  const template = readTemplate()

  const { render } = await import('./dist/server/entry-server.js')

  const { ok: blogOk, posts: blogPosts } = await fetchBlogSlugs()
  const routes = [...STATIC_ROUTES, ...blogPosts.map((p) => `/blog/${p.slug}`)]

  console.log(`Pre-rendering ${routes.length} routes (${blogPosts.length} blog posts)...`)

  let failures = 0
  let missingHead = 0
  for (const route of routes) {
    try {
      const { html: appHtml, head } = await render(route)
      if (!head) {
        missingHead++
        console.warn(`  ! ${route} rendered no <SEOHead> — falls back to generic metadata.`)
      }
      const page = applyHead(template, head, route).replace('<!--app-html-->', appHtml)
      const written = writeRoute(route, page)
      console.log(`  ✓ ${route} -> ${written}`)
    } catch (err) {
      failures++
      console.error(`  ✗ ${route}: ${err.message}`)
    }
  }

  if (failures > 0) {
    // A route that renders to nothing is worse than an obvious build failure —
    // it would silently ship the empty shell we're trying to eliminate.
    throw new Error(`${failures} route(s) failed to pre-render.`)
  }

  // Only regenerate the sitemap when the blog list actually loaded. Otherwise
  // leave the hand-maintained public/sitemap.xml that vite copied into dist/ —
  // overwriting it here would silently drop every /blog/ URL from the sitemap.
  if (blogOk) {
    writeSitemap(routes, blogPosts)
  } else {
    console.warn('  ! Blog list unavailable — keeping the existing sitemap.xml unchanged.')
  }

  console.log(
    `Pre-rendered ${routes.length} routes` +
      (missingHead ? ` (${missingHead} without page-specific metadata).` : '.'),
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
