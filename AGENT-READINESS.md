# Agent Readiness (AEO / agent discovery)

How this site makes itself discoverable and usable by AI agents. Checklist based on
isitagentready.com. Status as of 2026-07-17.

| Requirement | Status | Where |
|---|---|---|
| Link response headers (RFC 8288) | ✅ implemented — **needs host to serve them** | `public/_headers`, `vercel.json` |
| `/.well-known/api-catalog` (RFC 9727) | ✅ | `public/.well-known/api-catalog` |
| `/.well-known/agent-skills/index.json` | ✅ | `public/.well-known/agent-skills/` |
| `/.well-known/mcp/server-card.json` | ✅ | `public/.well-known/mcp/` |
| OAuth/OIDC discovery metadata | ✅ | `public/.well-known/oauth-authorization-server`, `oauth-protected-resource` |
| `auth.md` (WorkOS spec) | ✅ | `public/auth.md` (root-served) |
| WebMCP tools | ✅ (client-side, spec-nascent) | `src/components/WebMCPTools.tsx` |
| Content signals for AI | ✅ | `public/robots.txt` (`Content-Signal`) |
| DNS-AID records | ⛔ **manual — publish at your DNS provider** | see below |

## 1. Link headers (RFC 8288) — action required at deploy time

The homepage must return `Link:` headers pointing agents at the discovery resources.
These are defined in **two** places so they work on any host:

- **`public/_headers`** — applied by **Netlify** and **Cloudflare Pages**.
- **`vercel.json`** — applied by **Vercel**.

⚠️ **These headers only take effect if the site is served by one of those hosts.** The
isitagentready audit reported "No Link headers found" because the current/old host isn't
serving them. Deploy to Netlify, Cloudflare Pages, or Vercel (or configure your own
server/CDN to emit the same headers) and re-test. If you use a different server (nginx,
Apache, a CDN), copy the header block from `public/_headers` into that server's config.

Verify after deploy:
```bash
curl -sI https://truenorthbusinessloan.ca/ | grep -i '^link:'
```

## 2. `.well-known` discovery files

Static JSON served from `public/.well-known/`. Agents fetch these to learn what the site
offers. Keep `agent-skills/index.json` updated whenever you add a major user-facing action
or a new product/industry page.

## 3. OAuth / OIDC discovery

- `oauth-protected-resource` and `oauth-authorization-server` point at the site's real auth
  server (Supabase GoTrue, `https://kgwcogltpsmapxnjzjhm.supabase.co/auth/v1`).
- There is **no self-serve agent registration yet**. `auth.md` and the `agent_auth` block
  document the manual partner-onboarding path (`/partners`). When a self-serve flow exists,
  update `register_uri` and the `agent_auth` block.

## 4. WebMCP

`WebMCPTools.tsx` calls `navigator.modelContext.provideContext()` to expose in-page tools
(`start_loan_estimator`, `browse_loan_products`, …). The isitagentready check reports "no
WebMCP tools" because (a) `navigator.modelContext` only exists in agent-enabled browsers,
and (b) the check may not execute the page's JS. This is expected for the current draft
spec — the implementation is correct and future-proof. Add a tool here whenever you add a
new primary conversion action.

## 5. DNS-AID records — publish these at your DNS provider

DNS-based agent discovery (draft-mozleywilliams-dnsop-dnsaid) can't be shipped in the repo;
it lives in DNS. Add these to the `truenorthbusinessloan.ca` zone (values are examples —
adjust `endpoint`/`alpn`/`port` to your real agent endpoints; drop records for services you
don't run):

```dns
; Discovery index entrypoint (SVCB/HTTPS, ServiceMode)
_index._agents.truenorthbusinessloan.ca.  3600 IN HTTPS 1 truenorthbusinessloan.ca. (
    alpn="h2,h3" port=443
    endpoint="/.well-known/api-catalog" )

; MCP surface (only if/when a live MCP endpoint exists)
_mcp._agents.truenorthbusinessloan.ca.    3600 IN HTTPS 1 truenorthbusinessloan.ca. (
    alpn="h2,h3" port=443
    endpoint="/.well-known/mcp/server-card.json" )
```

Then **sign the zone with DNSSEC** (enable it in your DNS provider / registrar) so
validating resolvers return authenticated data. Verify:
```bash
dig +dnssec HTTPS _index._agents.truenorthbusinessloan.ca
```

If your DNS provider doesn't support SVCB/HTTPS record types yet, this item can't be
completed there — either move DNS to a provider that does (Cloudflare, Route 53, etc.) or
skip it; the HTTP-based discovery above already covers most agents.

## Keeping this current

When you add a new conversion action or public API, update **all** of: `agent-skills/index.json`,
`api-catalog`, the WebMCP tools, and (if it's an endpoint) the DNS-AID records.
