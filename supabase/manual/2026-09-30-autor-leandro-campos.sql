-- Byline change (decision tn-autor): posts signed by "True North Team" (or with no
-- author) are now signed by Leandro Campos, Business Loan Specialist, for E-E-A-T.
-- Only the author column changes; no backup table needed. Re-runnable: after the
-- first run the WHERE matches nothing.
-- After apply = true, trigger a Netlify deploy (blog pages are prerendered).

-- Before
select coalesce(author, '(null)') as author, status, count(*) as posts
from blog_posts
group by 1, 2
order by 1, 2;

update blog_posts
set author = 'Leandro Campos',
    updated_at = now()
where author = 'True North Team' or author is null;

-- After
select coalesce(author, '(null)') as author, status, count(*) as posts
from blog_posts
group by 1, 2
order by 1, 2;
