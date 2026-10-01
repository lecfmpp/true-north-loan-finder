import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planEdit, validateEdit, countOccurrences } from './edit-blog-post.mjs';

const find = '<p>An MCA is priced with a factor rate.</p>';
const base = { slug: 'a-post', field: 'content', find, replace: find + '<p>See <a href="/blog/x">x</a>.</p>' };

test('one exact match is applied once', () => {
  const r = planEdit('<h2>A</h2>' + find + '<p>end</p>', base);
  assert.equal(r.status, 'ok');
  assert.equal(countOccurrences(r.next, '/blog/x'), 1);
  assert.ok(r.next.startsWith('<h2>A</h2>') && r.next.endsWith('<p>end</p>'));
});
test('re-run after apply is a no-op', () => {
  const once = planEdit(find, base).next;
  // find is a prefix of replace, so it still occurs; replace present -> must not double-apply
  const r = planEdit(once, base);
  assert.equal(r.status, 'already');
});
test('zero or multiple matches refuse', () => {
  assert.equal(planEdit('<p>nothing</p>', base).status, 'error');
  assert.equal(planEdit(find + find, base).status, 'error');
});
test('validation', () => {
  assert.deepEqual(validateEdit(base), []);
  assert.ok(validateEdit({ ...base, field: 'title' }).length);
  assert.ok(validateEdit({ ...base, find: 'short' }).length);
  assert.ok(validateEdit({ ...base, replace: '<a onclick="x">' }).length);
  assert.deepEqual(validateEdit({ ...base, replace: base.replace + ' lesson = fine' }), []);
});
