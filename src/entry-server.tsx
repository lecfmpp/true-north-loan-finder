import { PassThrough } from 'node:stream';
import { renderToPipeableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { AppProviders, AppRoutes } from './App';
import { getSsrHead, resetSsrHead, type SsrHeadData } from './lib/ssr-head';
import { resetSsrData, setSsrData, type SsrBlogListItem, type SsrBlogPost } from './lib/ssr-data';

export interface RenderResult {
  html: string;
  head: SsrHeadData | null;
}

/** Data preloaded by the prerender script for the route being rendered. */
export interface RenderData {
  list?: SsrBlogListItem[];
  post?: SsrBlogPost;
}

/**
 * Render a route to static HTML.
 *
 * Uses renderToPipeableStream rather than renderToString because almost every
 * page in App.tsx is React.lazy. renderToString cannot suspend, so it would
 * emit the <PageLoader /> spinner instead of the page — useless for SEO.
 * onAllReady waits until every lazy chunk has resolved before we read the
 * output, so the HTML contains the real page content.
 */
export function render(url: string, data?: RenderData): Promise<RenderResult> {
  return new Promise((resolve, reject) => {
    let didError = false;
    resetSsrHead();
    setSsrData(data ?? {});

    const { pipe, abort } = renderToPipeableStream(
      <AppProviders>
        <StaticRouter location={url}>
          <AppRoutes />
        </StaticRouter>
      </AppProviders>,
      {
        onAllReady() {
          const stream = new PassThrough();
          const chunks: Buffer[] = [];
          stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
          stream.on('end', () => {
            const result = {
              html: Buffer.concat(chunks).toString('utf8'),
              head: getSsrHead(),
            };
            resetSsrData();
            if (didError) reject(new Error(`Render failed for ${url}`));
            else resolve(result);
          });
          stream.on('error', reject);
          pipe(stream);
        },
        onError(error) {
          didError = true;
          console.error(`  SSR error on ${url}:`, error);
        },
      },
    );

    // Don't let a hung suspense boundary stall the whole build.
    setTimeout(() => abort(), 15000);
  });
}
