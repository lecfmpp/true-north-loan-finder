# SEO / AEO Audit — True North Business Loan

Snapshot taken during the Claude migration, 2026-07-17. Use this as the running SEO backlog.

## What's already strong ✅

- **Per-page metadata** via `SEOHead` — dynamic title, description, canonical, Open Graph,
  Twitter cards, robots directives, and JSON-LD injection.
- **Structured data**: Organization + OfferCatalog schema in `index.html`; per-page schema
  through `SEOHead`.
- **Canonical discipline**: absolute `https://truenorthbusinessloan.ca`, no `www`, no
  trailing slash; `_redirects` enforces www-removal and trailing-slash normalization + 301s
  for legacy URLs.
- **Sitemap** (`public/sitemap.xml`, 36 URLs) and **robots.txt** with `Content-Signal`
  (`ai-train=no, search=yes, ai-input=yes`) and sitemap reference.
- **Performance hints** in `index.html`: preconnect/dns-prefetch/preload, deferred fonts,
  lazy-loaded non-critical routes and widgets in `App.tsx`.
- **AEO/agent layer**: see `AGENT-READINESS.md`.

## Highest-impact recommendations (prioritized)

### 1. Rendering: this is a client-rendered SPA — the #1 SEO/AEO risk
Content is rendered by React after JS loads. Google can render JS, but many AI crawlers and
answer engines read only the initial HTML, so they may see an empty shell. There is a
`prerender.js` (SSG) using `dist/server/entry-server.js`, but it is **not wired into
`npm run build`** and needs an SSR entry.
- **Fix options:** (a) finish the prerender pipeline and run it in the build so every route
  ships static HTML; or (b) adopt a meta-framework/SSR; or (c) use a prerender/edge service.
- Until then, prioritize prerendering at least Home, product pages, industry pages, and blog
  posts — the pages meant to rank and be quoted by LLMs.

### 2. Blog posts aren't in the sitemap
`sitemap.xml` is static and omits `/blog/:slug` URLs (posts live in Supabase). Generate the
sitemap at build time from the `blog_posts` table (status = published) so new content is
discoverable. Add this to the content workflow.

### 3. AEO writing standards (apply to every new page/post)
- H2/H3s phrased as the questions users ask; answer in the first 1–2 sentences.
- Add `FAQPage` structured data to pages with Q&A; `Article` schema to every blog post
  (headline, datePublished, dateModified, author, image).
- Use explicit numbers/ranges ("$5K–$800K", "24–48 hours"), comparison tables, and clear
  definitions — the formats LLMs extract.

### 4. Internal linking to the conversion goal
Ensure every product/industry page and blog post links to `/loan-estimator` and to 2–3
related pages. Add a consistent CTA block + a "related topics" cluster.

### 5. Housekeeping
- `robots.txt` still has `Disallow: /admin/` — harmless now (admin removed); can stay as a
  guard or be dropped.
- Keep `lastmod` in the sitemap current when pages change (refreshed to 2026-07-17 in this pass).
- Add `Article` + `BreadcrumbList` schema to blog posts if not already present in `BlogPost.tsx`.

## Quick wins done in this pass
- Refreshed all `sitemap.xml` `lastmod` dates to 2026-07-17.
- Confirmed no admin URLs leak into the sitemap or structured data.
- Strengthened the agent-discovery layer (see `AGENT-READINESS.md`).
