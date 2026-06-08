// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const site = process.env.PUBLIC_SITE_URL ?? 'https://papers.chlience.com';

export default defineConfig({
  site,
  integrations: [sitemap()],
  prefetch: {
    defaultStrategy: 'hover',
  },
});
