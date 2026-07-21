import type { APIRoute } from 'astro';
import data from '../generated/paper-data.json';
import { getAbsoluteUrl, siteDescription, siteTitle } from '../lib/site';

const escapeXml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL('https://papers.chlience.com');
  const items = data.papers
    .slice(0, 30)
    .map((paper) => {
      const url = getAbsoluteUrl(paper.path, origin);
      const publicationTime = paper.firstArchivedAt;
      const pubDate = publicationTime
        ? new Date(publicationTime.replace(' ', 'T')).toUTCString()
        : new Date(data.generatedAt).toUTCString();
      return `<item>
  <title>${escapeXml(paper.title)}</title>
  <link>${escapeXml(url)}</link>
  <guid>${escapeXml(url)}</guid>
  <pubDate>${escapeXml(pubDate)}</pubDate>
  <description>${escapeXml(paper.coreSignal)}</description>
</item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${escapeXml(siteTitle)}</title>
  <link>${escapeXml(origin.href)}</link>
  <description>${escapeXml(siteDescription)}</description>
  <lastBuildDate>${escapeXml(new Date(data.generatedAt).toUTCString())}</lastBuildDate>
${items}
</channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
};
