# Daily blog task — runbook

This is what the 2:00 AM scheduled task executes every day. It produces ONE new SEO/AEO
post using the WiseFunnel model in `BLOG-FRAMEWORK.md` and auto-publishes it.

## Steps

1. **Read the framework.** Open `blog-framework/BLOG-FRAMEWORK.md` and follow it.
2. **Pick a fresh topic.** Read `blog-framework/published-log.md` for what's already covered,
   and fetch `https://truenorthbusinessloan.ca/sitemap.xml` to see existing `/blog/` slugs.
   Choose a NEW high-intent topic (Pillar or Cluster) that isn't a duplicate. Rotate across:
   products (equipment financing, term loans, MCA, invoice factoring), industries
   (transportation, manufacturing, self-storage, property management, cannabis, franchises),
   geographies (Canada, US), and borrower questions (requirements, credit, speed, comparisons).
3. **Research.** Use web search for any factual claim. Keep claims evergreen and non-advisory.
   Never invent a specific rate, statistic, or lender name.
4. **Write** per the readability + element rules. Answer-first H2s. 4–6 FAQ pairs. One CTA to
   `/loan-estimator`. Build the inline-styled HTML `content`.
5. **Cover:** write a cover config and run
   `node blog-framework/generate-cover.mjs <cfg.json> drafts/<slug>/`. If `.env.local` has the
   service key, run `node blog-framework/upload-cover.mjs <slug> drafts/<slug>/` and use the
   printed URL as `featured_image_url`/`og_image_url`. Otherwise leave `featured_image_url` null.
6. **Assemble** the post JSON in `drafts/<slug>.json` (Layer 3 fields).
7. **QA gate** — run every check in `BLOG-FRAMEWORK.md#QA gate`. Fix before publishing.
8. **Publish:**
   - If `.env.local` has `SUPABASE_SERVICE_ROLE_KEY`:
     `node scripts/create-blog-post.mjs ./drafts/<slug>.json --publish`
     (this also appends the URL to `public/sitemap.xml`). Then commit + push so Netlify
     redeploys the updated sitemap: `git add -A && git commit -m "blog: <slug>" && git push`.
   - If NO service key: copy the post + cover to `blog-framework/ready-to-publish/<slug>/`
     and report that it's awaiting the key. Do not fail.
9. **Log it.** Append a line to `blog-framework/published-log.md`:
   `YYYY-MM-DD | <slug> | <focus keyword> | published|pending`.
10. **Report** a 2–3 sentence summary: title, URL (or pending), and topic rationale.

## Guardrails
- One post per run. Never duplicate an existing slug.
- Financial content: evergreen, factual, non-advisory. Cite sources for any hard number.
- If a step fails, stop and report — never publish a half-built or unverified post.
