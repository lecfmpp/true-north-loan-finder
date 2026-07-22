/**
 * Blog data preloaded for server rendering.
 *
 * Blog.tsx and BlogPost.tsx fetch from Supabase in a useEffect, which never
 * runs during prerendering — so those routes used to ship a loading skeleton
 * with no article content at all. Crawlers that don't execute JavaScript saw
 * nothing.
 *
 * The prerender script fetches the posts up front and puts them here before
 * calling render(). The components read this synchronously as their initial
 * state, so the server-rendered HTML contains the real list and article body.
 * In the browser this store is always empty, so the existing fetch runs
 * exactly as before.
 *
 * Module-level state is safe because the prerender renders one route at a
 * time, sequentially, resetting between routes.
 */

export interface SsrBlogListItem {
  id: string;
  title: string;
  slug: string;
  /** Required: every published post has an excerpt, and Blog.tsx expects one. */
  excerpt: string;
  author: string;
  tags: string[];
  created_at: string;
  featured_image_url?: string;
}

export interface SsrBlogPost extends SsrBlogListItem {
  content: string;
  updated_at: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  reading_time?: number;
}

interface SsrData {
  /** Posts for the /blog listing. */
  list?: SsrBlogListItem[];
  /** The single post being rendered, for /blog/:slug. */
  post?: SsrBlogPost;
}

let data: SsrData = {};

export const setSsrData = (next: SsrData) => {
  data = next ?? {};
};

export const resetSsrData = () => {
  data = {};
};

export const getSsrBlogList = (): SsrBlogListItem[] | undefined => data.list;

/** Returns the preloaded post only when it matches the route being rendered. */
export const getSsrBlogPost = (slug?: string): SsrBlogPost | undefined =>
  slug && data.post?.slug === slug ? data.post : undefined;
