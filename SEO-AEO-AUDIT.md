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

---

## Status as of 2026-07-22 — the five original items are closed

| Original item | Status |
|---|---|
| 1. Client-rendered SPA (the #1 risk) | **Done.** `npm run build` = client build → SSR build → prerender. 41 routes ship real HTML, including `/blog` and every `/blog/:slug`. |
| 2. Blog posts missing from the sitemap | **Done.** `sitemap.xml` is generated at build time from `blog_posts`, with real `lastmod`. |
| 3. AEO writing standards | **Done.** Class-based element system (`blog-framework/elements.html`), applied to every post. |
| 4. Internal linking | **Done.** Every post links to `/loan-estimator`; the page renders a CTA after each article. |
| 5. `Article` + `FAQPage` schema | **Done.** `Article` on all posts; `FAQPage` auto-extracted from Q&A sections. |

Also since: every route has a unique title/description/canonical + JSON-LD; body copy is
Canada-only; the daily blog pipeline generates to the element standard and triggers a
rebuild so new posts are prerendered.

### Known, deliberately left open

- **Three posts discuss US regulation** (`cannabis-business-loans…` on Schedule I / SAFE
  Banking, `merchant-cash-advance-explained…` on TILA, `unsecured-vs-secured…` on UCC-1).
  This is substantive content, not stray positioning — replacing it means writing the
  Canadian equivalents (e.g. PPSA in place of UCC-1), which is an editorial job.
- **13 posts have a `meta_title` over 60 chars** (62–78). Google truncates the display; the
  tag still works. Shortening them well is editorial, not mechanical.
- **Six `meta_description`s run 161–182 chars.** Cutting them at a sentence would drop half
  the text, so they were left; Google trims a few characters instead.
- **`signs-business-ready-growth-financing`** keeps question-shaped `<h3>` headings rather
  than a FAQ accordion — its whole structure is questions, so converting would scatter
  accordions through the article and remove real headings.
- **The quiz still offers "United States"** — the funnel was deliberately left intact.

---

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
