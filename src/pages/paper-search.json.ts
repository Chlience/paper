import data from '../generated/paper-data.json';
import { buildPaperSearchItems } from '../lib/paper-search.mjs';

export const prerender = true;

export function GET() {
  const items = buildPaperSearchItems(data.papers);
  return new Response(JSON.stringify(items), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
