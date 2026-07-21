# True North Blog Framework — the WiseFunnel model, adapted

This is the operating manual for producing a True North Business Loan blog post. It ports
WiseFunnel.io's three-layer blog system (Strategy → Design → Publish) to True North's
schema, brand, and lender/borrower positioning. Follow it top to bottom for every post.

The daily scheduled task (`blog-framework/DAILY-TASK.md`) runs this exact process unattended.

---

## Layer 0 — What True North is (positioning ground truth)

True North matches **Canadian small businesses** with **business loan offers of
$5K–$800K** through a **60-second loan estimator quiz**, with **approvals in 24–48 hours**
and funding often in one business day. Products: **equipment financing, small business
loans (term), merchant cash advance, invoice factoring.** Industry pages: transportation,
manufacturing, self-storage, property management, cannabis dispensary, established franchises.

Every post exists to move a reader toward `/loan-estimator` (the conversion goal).

---

## Layer 1 — Strategy (Authority Architect)

Write "people-first," E-E-A-T content on the Pillar-Cluster model.

**Pillar pages (1,500–2,500+ words):** broad, high-volume guides
(e.g. "The complete guide to business loans in Canada").
**Cluster posts (800–1,200 words):** specific long-tail answers that link up to a Pillar
(e.g. "How to qualify for equipment financing with a 600 credit score").

**E-E-A-T "secret sauce" — weave True North's real differentiators into every post:**
- **Experience:** the 60-second loan estimator that matches a business to real lenders.
- **Expertise:** the four loan products and when each fits; industry-specific nuances.
- **Authoritativeness:** $5K–$800K range, 24–48h approvals, Canada-wide coverage.
- **Trust:** honest pros/cons, real requirements, no hype; a soft credit check to see options.

**Competitor attack vectors (the "why most options fail" angle):**
| Target | Their gap (attack) | True North's edge (leverage) |
|---|---|---|
| Big banks | Slow (weeks), strict, low approval rates for SMBs | Matched multi-lender network, 24–48h, works below bank thresholds |
| Single direct lenders | One box; decline = dead end | Many lenders from one 60-second quiz |
| Generic loan marketplaces | Spammy, sell your data widely, no fit logic | Product- and industry-matched, purpose-built quiz |
| DIY (applying everywhere) | Multiple hard pulls, wasted time | One matched application, soft check first |

**Readability rules (hard):**
- Max ~20 words/sentence, max ~4 sentences/paragraph.
- Sentence-case H2/H3 phrased as the question the reader asks (AEO).
- Answer each H2 in the first 1–2 sentences, then elaborate.
- Explicit numbers/ranges ("$5K–$800K", "24–48 hours", "6 months in business").
- No emoji. Bold sparingly for scannability.

**Headline formula:** `[Verb/Question] + [Benefit] + [Specific result/number]`.
e.g. "How to Get a Small Business Loan in Canada (Approved in 24–48 Hours)".

**SEO metadata:** `meta_title` ≤ 60 chars; `meta_description` ≤ 160 chars with a benefit +
"True North" where natural. Slug is kebab-case, keyword-first.

---

## Layer 2 — Design (element system)

True North renders `blog_posts.content` as **sanitized HTML** (`BlogPost.tsx` → DOMPurify →
`.blog-content`). Structured elements are **class-based**: author the HTML with `tn-*`
classes and let the app style them.

- **Copy-paste markup for every element: `blog-framework/elements.html`** (open it in a
  browser to see each one rendered).
- **Authoritative CSS: `src/index.css`** (search "Blog element standard"). Change a style
  there once and every published post updates — no need to touch post HTML.
- Elements use the app's design tokens, so they work in light and dark mode.
- Verified: `class`, `href`, `<details>` and `<summary>` all survive DOMPurify's default
  sanitizer, so these render as authored.

**Do not hand-write inline styles in post content.** Body copy is left-aligned by default;
only `.tn-cta` and `.tn-pullquote` (plus the `.tn-center` helper) center their text.

| Class | Use |
|---|---|
| `tn-key-takeaway` | TL;DR box, near top (max 1) |
| `tn-stats` / `tn-stat` | 2–4 headline metrics |
| `tn-table-wrap` + `tn-yes` / `tn-no` | comparison / cost table (scrolls on mobile) |
| `tn-steps` (on `<ol>`) | ordered how-to as numbered cards |
| `tn-pitfalls` (on `<ul>`) | 2–4 mistakes to avoid |
| `tn-checklist` (on `<ul>`) | requirements / "what you need" |
| `tn-pullquote` (on `<blockquote>`) | one quotable line (max 1) |
| `tn-note` | caveat / rule of thumb / formula |
| `tn-link-card` (on `<a>`) | one cross-link (max 1, not in intro) |
| `tn-faq` | 4–6 `<details>` Q&A pairs |
| `tn-cta` + `.cta-button` | closing conversion (exactly 1, last) |

**Element selection pass** — run on every H2 before writing. Use the first that matches;
otherwise leave the section as prose. **At least 2 sections stay pure prose.** Max **6**
inline elements per post. Never fabricate a stat/row to fill an element.

| Draft signal | Element | HTML pattern (see `elements.html`) |
|---|---|---|
| TL;DR / short answer / bottom line | `key-takeaway` (max 1, near top) | green-left-border box |
| 3 headline metrics | `stat-trio` | 3-column stat row |
| Two options with dollar/number rows | `cost-table` | styled 3-col table |
| Two options, win/lose verdicts | `comparison-table` | styled table w/ check/x |
| Ordered how-to / setup | `decision-steps` (never `<ol>` for steps) | numbered cards |
| 2–4 mistakes / what to avoid | `pitfall-grid` | 2–4 red-accent cards |
| One quotable rule of thumb | `pull-quote` (max 1) | large centered quote |
| Caveat / "rule of thumb:" / formula | `note-callout` | gold-accent aside |
| One cross-link to a related post | `link-card` (max 1, not in intro) | bordered link box |
| Q&A | `faq` (4–6 pairs) | `<details>` accordion |
| Closing conversion | `cta-block` (exactly 1, last) | `.cta-button` → /loan-estimator |

**Guardrails:** max 1 each of key-takeaway, pull-quote, link-card, cta-block. Never stack
two boxed elements without a prose paragraph between them. Internal-link with keyword-rich
anchors to `/loan-estimator` and 2–3 related pages (product/industry/blog).

**Cover image (concept diagram).** Pick ONE type whose shape matches the post's spine:
- `spread` — a numeric range/multiplier (rate spread, $5K–$800K, X→Y).
- `versus` — A beats B on one metric (matched vs bank, quiz vs form).
- `steps` — an ordered process (how-to, N-step flow).
- `bars` — a benchmark ranking (approval odds by product, cost by loan type).

Generate it with `node blog-framework/generate-cover.mjs` (branded PNG, navy + green/gold,
no text, 1200×630). This becomes `featured_image_url` + `og_image_url`.

**AI-image upgrade (optional):** to use a real diffusion image instead, set an image API key
and swap the cover step (formula: `[topic as visual concept], deep navy #2b3a47 background,
forest green #22a15e and gold #efab4d accents, clean flat financial illustration, no people,
no text, 16:9`). Gemini image gen fits your existing `GEMINI_API_KEY`.

---

## Layer 3 — Publish (Supabase `blog_posts`)

Map every post to True North's schema (see `CLAUDE.md` for the full column list):

| Field | Rule |
|---|---|
| `title` | headline formula, ≤ ~65 chars |
| `slug` | kebab-case, keyword-first, unique |
| `excerpt` | 1–2 sentence answer, used on `/blog` cards |
| `content` | the assembled inline-styled **HTML** (elements + prose) |
| `featured_image_url` | uploaded cover URL (or `null`) |
| `author` | `True North Team` |
| `tags` | 4–6 topic tags |
| `meta_title` | ≤ 60 chars |
| `meta_description` | ≤ 160 chars |
| `meta_keywords` | focus + secondary keywords |
| `reading_time` | ~200 wpm estimate |
| `status` | `published` (auto-publish mode) or `draft` |
| `view_count` | omit (defaults) |

**Access:** RLS blocks the anon key. Publishing requires the **service_role key** in
`.env.local` (`SUPABASE_SERVICE_ROLE_KEY=...`). The publish command:

```bash
node scripts/create-blog-post.mjs ./drafts/<slug>.json --publish   # live
node scripts/create-blog-post.mjs ./drafts/<slug>.json             # draft
```

**After publishing, always:** append the new `/blog/<slug>` URL to `public/sitemap.xml`
with today's `lastmod` (the publish script does this with `--publish`).

---

## QA gate — run before publishing (hard fails)

1. No emoji anywhere. H2s are sentence case and question-shaped.
2. Opening answers the title in the first 1–2 sentences.
3. Exactly one `cta-block` (last), linking to `/loan-estimator`. ≥ 2 internal links total.
4. `meta_title` ≤ 60, `meta_description` ≤ 160, slug unique (checked against DB).
5. Every number/claim is generic-true or cited — **never invent a specific rate, stat, or
   lender name.** Financial content: keep claims evergreen and non-advisory.
6. At least 2 prose-only sections; ≤ 6 inline elements; no two boxed elements adjacent.
7. 4–6 FAQ pairs present (feeds future FAQPage schema).

---

## Workflow — order of operations

1. Pick the topic (fresh, high-intent; check DB for duplicate slugs).
2. Keyword + intent: focus keyword, 3–5 secondary, search intent, which competitor gap.
3. Outline: Pillar or Cluster; question-shaped H2s; where each element goes.
4. Draft prose following the readability rules; answer-first per section.
5. Element pass (Layer 2); assemble the inline-styled HTML `content`.
6. Generate the cover (`generate-cover.mjs`), upload, set `featured_image_url`/`og_image_url`.
7. Build the post JSON (Layer 3 fields). Run the QA gate.
8. Publish with `create-blog-post.mjs --publish`; confirm `/blog/<slug>` and sitemap.
