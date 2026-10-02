# True North cover system (v2) — 3 templates + rotation

Blog covers used to come from `../generate-cover.mjs`: the same dark navy card, headline on the
left and a small diagram on the right, for every post. In the `/blog` grid they looked identical.
This folder replaces that with three templates in the site's identity, rendered from HTML/CSS with
Playwright (Chromium), and a rotation rule so neighbouring posts never share a look.

Identity: navy `#2b3a47` (Tailwind `--primary`), forest green `#22a15e` (`--secondary`), compass
gold `#efab4d`, the site gradient (`--gradient-primary`), Poppins (`../fonts`, SIL OFL), and the
site mark (`public/lovable-uploads/eae8a3b3-…png`) + the "True North Business Loan" wordmark.
Size: **1200×630** (the size the site and OG/Twitter cards already use). Keep key content between
y≈60 and y≈570: the post page shows the cover in a short, wide box (`h-64 md:h-96`, object-cover)
that trims the top and bottom slightly.

## The three variants

| Variant | Look | Use when the post has… | Output |
|---|---|---|---|
| `dado` | Light paper background, green rail, one huge number with a gold highlight, a navy card with 2–3 bars | one sourced number that is the answer (cost gap, rate, days, %) | `cover-dado.png` |
| `icones` | Site gradient navy → green, 2–3 white tiles with Lucide icons (optional VS badge), faint big icon in the back | two options or 3 ideas (vs, pros/cons, steps, types) | `cover-icones.png` |
| `foto` | Real free stock photo of the topic, full bleed, navy overlay on the left, headline + green chip with the key fact, photo credit | anything with a concrete subject (equipment, trucks, restaurant, clinic, store) | `cover-foto.jpg` |

## How to make a cover

1. Write `drafts/<slug>.cover.json` (example: `drafts/equipment-lease-vs-loan-canada.cover.json`).
   Fill the block for the variant you need; fill all three to compare.
   - `dado`: `kicker`, `value`, `label`, `footer` (may use `<b>`), `card.title`, `card.rows[]`
     (`label`, `value`, `amount`, `color`: green|gold|gray|navy), `card.note`. The number MUST be in
     the post and sourced or computed there.
   - `icones`: `kicker`, `headline`, `sub`, `ghost` (icon), `vs`, `tiles[]` (`icon`, `title`, `text`).
     Icons are in `icons/` (Lucide, ISC). Need another one? Copy its SVG from the `lucide-static`
     npm package (`npm pack lucide-static`) into `icons/`.
   - `foto`: `kicker`, `headline`, `photo` (path under `photos/`), `position` (CSS object-position),
     `flip` (mirror so the subject sits right of the text), `chip`, `chipIcon`, `credit`.
2. Render:
   ```bash
   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \
   node blog-framework/covers/render-cover.mjs drafts/<slug>.cover.json drafts/<slug>/ --pick <variant>
   ```
   (without `--variant` it renders every block in the config). `--pick` copies the chosen one to
   `drafts/<slug>/cover.png` (or `cover.jpg` for `foto`), which `../upload-cover.mjs` uploads.
   Without the service key, copy it to `public/blog-images/<slug>.<png|jpg>` and set
   `featured_image_url` to `https://truenorthbusinessloan.ca/blog-images/<slug>.<ext>`.
3. Look at the PNG/JPG before committing (headline fits, nothing important under the overlay).
4. Add a line to `rotation-log.md`.

## Rotation rule

- Cycle: **foto → dado → icones → foto …** The next post uses the variant after the last line of
  `rotation-log.md`.
- Never the same variant twice in a row, and at least one `foto` in every three posts.
- Allowed swap: if the next one is `dado` but the post has no single, sourced number worth the
  whole cover, use the following variant and write `(swap)` in the log. Same if `foto` has no
  fitting free photo.
- Never reuse a photo within 10 posts; vary the background subject too (machinery, vehicles,
  shop fronts, people at work, documents).

## Photos (`foto` variant)

- Sources: Unsplash, Pexels or Pixabay (free licenses). Wikimedia Commons only with CC0/PD/CC BY/
  CC BY-SA, and then the credit on the cover is mandatory.
- Topic first: the photo must show what the post is about (the equipment, the trade, the place).
  Prefer small-business settings; avoid brand logos and faces as the main subject.
- Save the file in `photos/` as `<subject>-<author>-<site>.jpg`, max 1800px wide, EXIF stripped
  (`convert in.jpg -resize 1800x -quality 82 -strip out.jpg`), and add a row to `photos/CREDITS.md`
  (author, source page, license, how it was obtained, posts that use it).
- Agent network note: unsplash.com, pexels.com, pixabay.com and wikimedia are blocked in the agent
  sandbox. What worked: find a public GitHub repo that credits a specific Unsplash photo (GitHub code
  search for `"unsplash.com/photos" <subject>`), download it from raw.githubusercontent.com, and
  confirm author + license on the Unsplash page with the Exa fetch tool. If you cannot confirm the
  license, do not use the photo.

## Files

- `render-cover.mjs` — renderer (Playwright). `cover.css` — the three templates and brand tokens.
- `icons/` — Lucide SVGs (ISC, `icons/LICENSE-lucide.txt`). `photos/` — photos + `CREDITS.md`.
- `rotation-log.md` — which variant each post used.
- `../generate-cover.mjs` — old single-template generator (resvg). Kept for old posts; do not use
  for new ones.
