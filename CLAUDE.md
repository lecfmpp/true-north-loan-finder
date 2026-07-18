# CLAUDE.md — True North Business Loan

Guide for working on this codebase with Claude. Read this first.

## What this is

A lead-generation website for **True North Business Loan** — matches Canadian and US
small businesses with business loan offers ($5K–$800K) via a quiz funnel, and ranks in
search / AI answers through SEO + AEO (Answer Engine Optimization) content.

Migrated from Lovable.dev on 2026-07-17. The **admin panel was removed** in this
migration (see "What was removed" below). Everything else — the funnel, the Supabase
backend, all public pages, and the SEO/AEO layer — was kept intact.

## Tech stack

- **Frontend:** React 18 + TypeScript, Vite 5, React Router v6 (`BrowserRouter`), Tailwind CSS + shadcn/ui (Radix), lucide-react icons.
- **Backend:** Supabase (project `kgwcogltpsmapxnjzjhm`) — Postgres + Auth + Storage + ~40 Edge Functions. Client at `src/integrations/supabase/client.ts`.
- **State/data:** `@tanstack/react-query`, `react-hook-form` + `zod`.
- **Hosting:** static SPA build. `public/_headers` + `public/_redirects` are Netlify/Cloudflare-Pages format; `vercel.json` mirrors them for Vercel.

## Run it locally

```bash
npm install
npm run dev        # http://localhost:8080 (see vite.config.ts)
npm run build      # production build to dist/
npm run preview    # serve the build locally
npm run lint
```

Environment variables live in `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
`VITE_SUPABASE_PROJECT_ID`). These are the public anon values and are safe in the client.
**Never** put the Supabase `service_role` key in `.env` or any `VITE_`-prefixed variable —
see the content workflow below.

## Project map

```
src/
  App.tsx                 Routes (all public pages)
  pages/                  One file per route (Home, Quiz, Results, Application*, industry & product pages, Blog, BlogPost, Auth, Broker*, Partners, legal)
  components/             Header, Footer, SEOHead, WebMCPTools, SocialProofWidget, etc.
  components/ui/          shadcn/ui primitives
  components/partner/     Partner-facing dashboard bits
  hooks/                  use-auth, use-*-application-draft, use-toast
  integrations/supabase/  client.ts (config) + types.ts (generated DB types)
  utils/                  seo-utils, google-indexing, performance
public/                   Static assets + SEO/agent-discovery files (see AGENT-READINESS.md)
supabase/                 config.toml, migrations/ (~130), functions/ (~40 edge functions)
```

Key routes: `/` (Home) · `/loan-estimator` (Quiz) · `/results/:responseId` · `/how-it-works`
· product pages (`/equipment-financing`, `/small-business-loans`, `/merchant-cash-advance`,
`/invoice-factoring`) · industry pages (`/transportation`, `/manufacturing`, `/self-storage`,
`/property-management`, `/cannabis-dispensary`, `/established-franchises`) · `/blog`,
`/blog/:slug` · `/application-usa`, `/application-canadian`, `/application-status` ·
`/partners`, `/broker-signup` · `/privacy`, `/terms`.

## What was removed in the migration

- `src/pages/Admin.tsx` and the entire `src/components/admin/` folder.
- The `/admin` route and its import in `App.tsx`.
- The "Admin" nav links in `Header.tsx`; post-login redirects in `Auth.tsx` now go to `/application-status` instead of `/admin`.

Kept on purpose: `Auth.tsx` and `hooks/use-auth.tsx` (used by the application/broker
flows), the whole Supabase backend, and every public/front-facing page. The Supabase
**Edge Functions were not deleted** — they run on Supabase, not in this build, and several
feed the funnel. Removing them is a separate backend decision.

## Content workflow — creating blog / SEO posts

Blog posts are rows in the Supabase `blog_posts` table and render at `/blog/:slug`
(`BlogPost.tsx` sanitizes `content` HTML with DOMPurify). `Blog.tsx` lists posts with
`status = 'published'`.

### `blog_posts` schema (current)

| column | type | notes |
|---|---|---|
| `id` | uuid | auto |
| `title` | text | **required** |
| `slug` | text | **required**, unique, kebab-case |
| `excerpt` | text | 1–2 sentence summary (used on `/blog` cards + meta) |
| `content` | text | **required** — sanitized **HTML** (headings, `<p>`, lists, images) |
| `featured_image_url` | text | full URL or a path in the `blog-images` storage bucket |
| `author` | text | defaults to `True North Team` |
| `tags` | text[] | topic tags |
| `meta_title` | text | SEO `<title>` override |
| `meta_description` | text | SEO meta description (~150–160 chars) |
| `meta_keywords` | text[] | |
| `reading_time` | int | minutes |
| `status` | text | set to `'published'` to make it live |
| `view_count` | int | |
| `created_at` / `updated_at` | timestamptz | auto |

### Access — important

Row Level Security **blocks the public anon key from inserting**. The anon key can only
`SELECT` posts where `status = 'published'`. To create/edit posts you need write access
via **one** of:

1. **Supabase service_role key** (bypasses RLS) — the approach wired up in
   `scripts/create-blog-post.mjs`. Put the key in `.env.local` (git-ignored):
   ```
   SUPABASE_SERVICE_ROLE_KEY=...   # from Supabase dashboard → Project Settings → API
   ```
   Then Claude drafts a post and runs:
   ```bash
   node scripts/create-blog-post.mjs ./drafts/my-post.json
   ```
2. **Supabase MCP connector** pointed at project `kgwcogltpsmapxnjzjhm` — Claude can
   `execute_sql` to insert directly. Use only if the connected Supabase account owns this project.

Ask Leandro which he wants before writing to the live DB. Draft the post as a JSON file
first (see `scripts/blog-post.template.json`) so it can be reviewed before publishing
(`status: "draft"` until approved).

### After publishing, always
- Add the new URL to `public/sitemap.xml` with today's `lastmod`.
- Write SEO/AEO content per the rules in AGENT-READINESS.md (question-style H2s, direct
  first-sentence answers, FAQ + Article structured data).

## SEO / AEO conventions (follow on every page & post)

- **Per-page metadata:** every page renders `<SEOHead>` (`src/components/SEOHead.tsx`) with
  a unique `title`, `description`, `canonicalUrl`, and JSON-LD `structuredData`. Never ship
  a page without it.
- **Structured data:** Organization schema is in `index.html`. Add page-appropriate schema
  via `SEOHead` — `Article` for blog posts, `FAQPage` for Q&A blocks, `Service`/`Product`
  for loan-product pages, `BreadcrumbList` for deep pages.
- **AEO writing:** phrase H2/H3s as the questions people (and LLMs) ask; answer in the first
  1–2 sentences before elaborating; use short paragraphs, comparison tables, and explicit
  numbers/ranges. This is what gets quoted in AI answers.
- **Canonicals:** always absolute, `https://truenorthbusinessloan.ca`, no `www`, no trailing slash.
- **Internal linking:** every product/industry page should link to `/loan-estimator` (the
  conversion goal) and to 2–3 related pages.

See `AGENT-READINESS.md` for the agent-discovery layer (Link headers, `.well-known`, WebMCP, DNS-AID).

## Conventions

- Path alias `@/` → `src/` (see `tsconfig` + `vite.config.ts`).
- `noUnusedLocals`/`noUnusedParameters` are off; still, keep imports clean.
- Verify before shipping: `npm run build` **and** `npx tsc --noEmit -p tsconfig.app.json` must pass.
- Prefer editing existing shadcn/ui components over adding new UI libraries.
