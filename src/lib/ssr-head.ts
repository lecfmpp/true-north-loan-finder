/**
 * Collects <head> metadata during server rendering.
 *
 * SEOHead applies its tags in a useEffect, which never runs while pre-rendering.
 * Without this, every static HTML file would ship the generic title, description
 * and canonical from index.html — 23 pages of duplicate metadata, which is worse
 * for SEO than the empty shell we're replacing.
 *
 * So on the server SEOHead also records its resolved props here during render,
 * and the prerender script folds them into the HTML template.
 *
 * Module-level state is safe because the prerender renders one route at a time,
 * sequentially, resetting between routes.
 */

export interface SsrHeadData {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl: string;
  ogType: string;
  ogImage: string;
  article?: {
    author?: string;
    publishedTime?: string;
    modifiedTime?: string;
    section?: string;
    tags?: string[];
  };
  structuredData?: unknown;
}

export const IS_SERVER = typeof window === 'undefined';

let collected: SsrHeadData | null = null;

export const resetSsrHead = () => {
  collected = null;
};

export const setSsrHead = (data: SsrHeadData) => {
  collected = data;
};

export const getSsrHead = (): SsrHeadData | null => collected;
