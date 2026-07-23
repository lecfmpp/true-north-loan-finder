// Markdown for Agents — content negotiation at the edge.
//
// When a client sends `Accept: text/markdown`, this returns a markdown version
// of the page instead of HTML. Browsers (which send `Accept: text/html`) are
// untouched and get the normal HTML, so there is no impact on human visitors.
//
// The site prerenders every route to static HTML, so the markdown is derived
// from that already-rendered content — no separate markdown source to keep in
// sync. Non-markdown requests return early before any origin fetch, so this
// adds no latency to the common path.
//
// Registered in netlify.toml.

import type { Config, Context } from "https://edge.netlify.com";

/** Rough token estimate for the x-markdown-tokens header (~4 chars/token). */
const estimateTokens = (s: string) => Math.max(1, Math.ceil(s.length / 4));

const decodeEntities = (s: string) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&hellip;/g, "…");

const stripTags = (s: string) => decodeEntities(s.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();

/**
 * Convert a prerendered page to markdown.
 *
 * Deno's edge runtime has no DOMParser, so this is a focused regex converter
 * for the tags these pages actually use (headings, paragraphs, lists, links,
 * tables, blockquotes, FAQ accordions, images). It is not a general-purpose
 * HTML→markdown engine, and does not need to be — the input is our own markup.
 */
function htmlToMarkdown(html: string): string {
  // Extract the content region, not the whole page chrome. Blog posts wrap the
  // article body in `.blog-content`; grabbing that (through to </article>, which
  // also picks up the closing CTA) skips the back-button, featured-image
  // skeleton and byline badges whose markup otherwise bleeds across block
  // boundaries and flattens the output onto one line. Other page types have no
  // <main>/<article>, so they fall through to <body> with chrome stripped below.
  let body =
    html.match(/<div[^>]*class=["'][^"']*blog-content[^"']*["'][^>]*>([\s\S]*?)<\/article>/i)?.[1] ??
    html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ??
    html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1] ??
    html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ??
    html;

  // Drop non-content regions and anything that isn't prose.
  body = body
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<form[\s\S]*?<\/form>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  // Element labels (key-takeaway, note callout) are inline spans; promote them
  // to their own bold line so they don't run into the text that follows.
  body = body.replace(
    /<span[^>]*class=["'][^"']*tn-label[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi,
    (_m, t) => `\n\n**${stripTags(t)}**\n\n`,
  );

  // FAQ accordions: <summary> is the question, the rest of <details> the answer.
  body = body.replace(/<summary[^>]*>([\s\S]*?)<\/summary>/gi, (_m, q) => `\n\n### ${stripTags(q)}\n\n`);

  // Tables → GitHub-flavoured markdown tables.
  body = body.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (_m, t) => {
    const rows = [...String(t).matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((r) =>
      [...String(r[1]).matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((c) => stripTags(c[1])),
    );
    if (!rows.length) return "";
    const width = Math.max(...rows.map((r) => r.length));
    const pad = (r: string[]) => Array.from({ length: width }, (_, i) => r[i] ?? "");
    const out = [`| ${pad(rows[0]).join(" | ")} |`, `| ${Array(width).fill("---").join(" | ")} |`];
    for (const r of rows.slice(1)) out.push(`| ${pad(r).join(" | ")} |`);
    return `\n\n${out.join("\n")}\n\n`;
  });

  body = body
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_m, t) => `\n\n# ${stripTags(t)}\n\n`)
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_m, t) => `\n\n## ${stripTags(t)}\n\n`)
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_m, t) => `\n\n### ${stripTags(t)}\n\n`)
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_m, t) => `\n\n#### ${stripTags(t)}\n\n`)
    .replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, (_m, t) => `\n\n##### ${stripTags(t)}\n\n`)
    .replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, (_m, t) => `\n\n###### ${stripTags(t)}\n\n`)
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_m, t) => `\n\n> ${stripTags(t)}\n\n`)
    .replace(/<(?:strong|b)[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi, (_m, t) => `**${stripTags(t)}**`)
    .replace(/<(?:em|i)[^>]*>([\s\S]*?)<\/(?:em|i)>/gi, (_m, t) => `*${stripTags(t)}*`)
    .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href, t) => {
      const text = stripTags(t);
      return text ? `[${text}](${href})` : "";
    })
    .replace(/<img[^>]*alt=["']([^"']*)["'][^>]*src=["']([^"']+)["'][^>]*>/gi, (_m, alt, src) => `![${alt}](${src})`)
    .replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, (_m, src) => `![](${src})`)
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, t) => `\n- ${stripTags(t)}`)
    .replace(/<\/(?:ul|ol)>/gi, "\n\n")
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_m, t) => `\n\n${stripTags(t)}\n\n`)
    .replace(/<hr[^>]*>/gi, "\n\n---\n\n")
    // Boxed containers (element cards, FAQ items) end a block — keep them apart.
    .replace(/<\/(?:div|details|section)>/gi, "\n\n");

  // Whatever tags remain: strip them, decode entities, normalise blank lines.
  return decodeEntities(body.replace(/<[^>]+>/g, " "))
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim() + "\n";
}

export default async (request: Request, context: Context) => {
  const accept = request.headers.get("accept") || "";
  // Only agents that explicitly ask for markdown get it. Everyone else — every
  // browser — passes straight through untouched.
  if (!/text\/markdown/i.test(accept)) return;

  const response = await context.next();
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response; // assets, redirects, etc.

  const markdown = htmlToMarkdown(await response.text());
  const headers = new Headers({
    "content-type": "text/markdown; charset=utf-8",
    "x-markdown-tokens": String(estimateTokens(markdown)),
    // Caches must key on Accept so a markdown response is never served to a browser.
    vary: "Accept",
    "access-control-allow-origin": "*",
  });
  const cc = response.headers.get("cache-control");
  if (cc) headers.set("cache-control", cc);

  return new Response(markdown, { status: response.status, headers });
};

export const config: Config = {
  path: "/*",
  // Never touch static assets or the machine-readable files — those already
  // have their own correct content types.
  excludedPath: [
    "/assets/*",
    "/.well-known/*",
    "/*.json",
    "/*.xml",
    "/*.txt",
    "/*.md",
    "/*.ico",
    "/*.png",
    "/*.jpg",
    "/*.jpeg",
    "/*.svg",
    "/*.webp",
    "/*.gif",
    "/*.woff2",
  ],
};
