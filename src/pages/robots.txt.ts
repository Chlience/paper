import type { APIRoute } from 'astro';
import { getAbsoluteUrl } from '../lib/site';

export const GET: APIRoute = ({ site }) => {
  const sitemap = getAbsoluteUrl('/sitemap.xml', site);
  return new Response(`User-agent: *\nAllow: /\nSitemap: ${sitemap}\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
