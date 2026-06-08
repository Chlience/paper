import type { APIRoute } from 'astro';
import { getAbsoluteUrl } from '../lib/site';

export const GET: APIRoute = ({ site }) => {
  const sitemapShard = getAbsoluteUrl('/sitemap-0.xml', site);
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '  <sitemap>',
    `    <loc>${sitemapShard}</loc>`,
    '  </sitemap>',
    '</sitemapindex>',
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
