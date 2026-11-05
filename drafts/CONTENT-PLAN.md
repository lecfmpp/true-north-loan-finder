# True North Business Loan — Content Plan (SEO/AEO)

Last updated: 2026-11-05 · Owner: Leandro Campos

## Objective

Improve Google indexing and rankings for Canadian business-loan intent. The Nov-2026
Google Search Console export showed ~35 pages **not indexed** ("Crawled – currently
not indexed" 16, "Discovered – currently not indexed" 19). For a site with ~60 blog
posts, this is almost always **thin/overlapping content + weak internal linking +
low topical authority**, not a crawl bug. (The only code bug — the sitemap listing
redirecting `/privacy-policy` and `/terms-of-service` — is already fixed.)

### Strategy
1. **Depth over volume.** Add fewer, deeper, genuinely differentiated pages that earn
   indexing — not more near-duplicates that cannibalize existing posts.
2. **Pillar → cluster internal linking.** Each new post links up to its pillar and
   sideways to 2–3 siblings, and the pillar links down to every cluster post. Strong
   internal links are the fastest lever to get "Discovered – not indexed" pages crawled.
3. **AEO first** (per AGENT-READINESS.md): question-style H2/H3s, the answer in the
   first 1–2 sentences, short paragraphs, comparison tables, explicit CAD numbers and
   ranges, and an FAQ block. This is what gets quoted in AI answers.
4. **Every post** links to `/loan-estimator` (conversion goal) and carries unique
   `meta_title` / `meta_description` and accurate Canadian facts (YMYL — no fabricated
   figures; prefer ranges and "confirm current limits with the provider").

## Pillars & clusters

- **P1 — "Business Loans in Canada" (head term).** Hub page linking all clusters.
  Supporting (mostly exist): requirements checklist, approval timelines, bad credit,
  bank vs alternative lender, line of credit vs term loan, collateral, fees, rates.
- **P2 — Government & institutional funding.** CSBFP guide, BDC guide, CSBFP-vs-BDC
  (exists). Gap: standalone CSBFP and BDC deep-dives.
- **P3 — Product deep-dives** (mostly exist): equipment financing, MCA, invoice
  factoring, working capital, acquisition loans, lease vs loan.
- **P4 — Industry pages** (many exist): trucking, manufacturing, self-storage,
  restaurant, construction, retail, medical, staffing, property management, franchise,
  landscaping, auto repair, cleaning. Gaps: dental, HVAC, e-commerce, hospitality/hotel,
  agriculture/farm, fitness/gym, salon/spa, daycare.
- **P5 — Local/provincial (lowest competition, high intent).** Gap: no provincial pages.
  Ontario, Alberta, BC, Quebec, + major cities (Toronto, Calgary, Vancouver).

## Prioritized backlog (batch 1 = in progress)

| # | Title | Slug | Primary keyword | Intent | Pillar | Status |
|---|---|---|---|---|---|---|
| 1 | Canada Small Business Financing Program (CSBFP): Complete Guide | `canada-small-business-financing-program-csbfp-guide` | canada small business financing program | informational/high | P2 | drafting |
| 2 | BDC Business Loans in Canada: Rates, Eligibility, How to Apply | `bdc-business-loans-guide-canada` | bdc business loans | informational/high | P2 | drafting |
| 3 | Business Loans in Ontario: Options, Rates & How to Qualify | `business-loans-ontario` | business loans ontario | commercial/local | P5 | drafting |
| 4 | Business Loans in Alberta: Options, Rates & How to Qualify | `business-loans-alberta` | business loans alberta | commercial/local | P5 | backlog |
| 5 | Business Loans in British Columbia | `business-loans-british-columbia` | business loans bc | commercial/local | P5 | backlog |
| 6 | HVAC Contractor Financing in Canada | `hvac-contractor-financing-canada` | hvac business loan | commercial | P4 | backlog |
| 7 | Dental Practice Financing in Canada | `dental-practice-financing-canada` | dental practice loan canada | commercial | P4 | backlog |
| 8 | E-commerce Business Loans in Canada | `ecommerce-business-loans-canada` | ecommerce business loan | commercial | P4 | backlog |
| 9 | Hotel & Hospitality Financing in Canada | `hotel-hospitality-financing-canada` | hotel financing canada | commercial | P4 | backlog |
| 10 | Business Loans in Canada: The Complete 2026 Guide (PILLAR) | `business-loans-canada-complete-guide` | business loans canada | head/pillar | P1 | backlog |

Also pending: `how-to-get-a-small-business-loan-in-canada.json` already drafted in
`drafts/` but not yet published — review and publish with batch 1.

## Publish workflow

Drafts are JSON files in `drafts/` matching `scripts/blog-post.template.json`
(`status: "draft"`). To publish:

```bash
# Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (git-ignored)
node scripts/create-blog-post.mjs ./drafts/<slug>.json            # saves as draft
node scripts/create-blog-post.mjs ./drafts/<slug>.json --publish  # goes live + adds to sitemap
```

After publishing: the script appends the URL to `public/sitemap.xml` — commit + push so
the deploy picks it up. Then request indexing in GSC for the new URL.

## After each batch
- Add internal links FROM 2–3 existing, already-indexed posts TO each new post (this is
  what pulls the new URL into the index fastest).
- In GSC, use URL Inspection → "Request indexing" for each new/fixed URL.
