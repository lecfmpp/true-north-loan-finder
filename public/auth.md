# Auth.md

_Agent authentication metadata for truenorthbusinessloan.ca — see <https://github.com/workos/auth.md>._

True North Business Loan does not currently expose a public authenticated API
for autonomous agents. Public content on this site (loan product pages,
industry pages, the loan estimator quiz, and the blog) is accessible without
authentication and is intended to be readable by AI agents subject to the
preferences declared in `/robots.txt` (see the `Content-Signal` directive).

## Programmatic access

- Public HTML pages: no authentication required.
- Sitemap: <https://truenorthbusinessloan.ca/sitemap.xml>
- Agent skills index: <https://truenorthbusinessloan.ca/.well-known/agent-skills/index.json>
- API catalog: <https://truenorthbusinessloan.ca/.well-known/api-catalog>

## Partner and lead-buyer integrations

Partners who purchase leads receive credentials through a manual onboarding
process. There is currently **no self-serve agent registration endpoint**.

To request access on behalf of an agent or automated system, contact True
North Business Loan through the partner sign-up flow at
<https://truenorthbusinessloan.ca/partners>. Once approved, integration
details (webhook URL, API key handling, and lead payload format) are shared
directly with the partner.

## Future work

When a self-serve OAuth authorization server is published, this document and
`/.well-known/oauth-protected-resource` will be updated with:

- `authorization_servers` populated with the issuer URL
- `scopes_supported`
- An `agent_auth` block in `/.well-known/oauth-authorization-server` with a
  `register_uri` for dynamic client registration
