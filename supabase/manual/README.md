# Manual migrations

One-off SQL run against the live database through the **Supabase migration**
workflow, rather than typed into an interactive connector. Everything here is
committed first, so the exact statement that ran is reviewable and recorded.

This is for **data** fixes and small schema changes made by hand. Schema managed
by the Supabase CLI still belongs in `supabase/migrations/`.

## Running one

1. Add the SQL as `YYYY-MM-DD-short-description.sql` in this folder and commit it.
2. **Actions → Supabase migration → Run workflow**, pick the file, leave
   `apply = false`.
3. The SQL runs inside a transaction that is **rolled back**. The log prints the
   row counts it would have changed (`UPDATE 3`, and so on).
4. If the counts look right, run it again with `apply = true` to commit.

If the migration touched `blog_posts`, trigger a Netlify deploy afterwards —
blog content is prerendered at build time, so the static HTML will otherwise
keep serving the previous version. The workflow reminds you of this.

## Writing the SQL

- **Scope every statement.** `where status = 'published'`, `where slug in (...)` —
  never an unqualified `update`.
- **Make it re-runnable.** Guard with a condition that is already false after the
  first run (`where content not like '%tn-faq%'`), so a repeat is a no-op rather
  than a double application.
- **Prefer a preview first.** For anything involving a regex, write the `select`
  version and read the output before committing to the `update`. Postgres
  greediness in particular is easy to get wrong: the *first* quantifier in a
  pattern sets the greediness of the whole expression, so a `(.*?)` after a
  greedy `[^<]*` will not behave as expected.
- **Back up before a destructive change**, and say so in a comment at the top of
  the file:
  `create table blog_posts_backup_YYYYMMDD as select * from blog_posts;`

## Required secret

`SUPABASE_DB_URL` — Supabase → Project Settings → Database → Connection string →
URI (include `?sslmode=require`). It is scoped to this one database, unlike an
account-wide personal access token.
