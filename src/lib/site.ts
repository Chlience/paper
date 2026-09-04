export const siteTitle = 'Chlience Paper Archive';

export const siteDescription =
  'LLM, RL, systems, safety, theory paper reading notes with author and cross-paper relationships.';

export const fallbackSiteUrl = 'https://papers.chlience.com';

export const paths = {
  home: '/',
  papers: '/papers/',
  topics: '/topics/',
  mainlines: '/mainlines/',
  authors: '/authors/',
  archive: '/archive/',
  workflow: '/workflow/',
  synthesisWorkflow: '/synthesis-workflow/',
  mainlineTemplate: '/mainline-template/',
  template: '/template/',
  mainSite: 'https://chlience.com',
};

export const getAbsoluteUrl = (pathname: string, site?: URL | null) => {
  const base = site?.href ?? fallbackSiteUrl;
  return new URL(pathname, base).href;
};

export const formatDate = (value?: string) => {
  if (!value) return 'Undated';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
};

export const createWebsiteJsonLd = (site?: URL | null) => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: siteTitle,
  url: site?.href ?? fallbackSiteUrl,
  description: siteDescription,
});

export const createArticleJsonLd = ({
  schemaType = 'ScholarlyArticle',
  title,
  description,
  url,
  firstArchivedAt,
  updatedAt,
  authors,
  organizationAuthor,
}: {
  schemaType?: 'Article' | 'ScholarlyArticle';
  title: string;
  description: string;
  url: string;
  firstArchivedAt?: string;
  updatedAt?: string;
  authors?: string;
  organizationAuthor?: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': schemaType,
  headline: title,
  description,
  url,
  datePublished: firstArchivedAt,
  dateModified: updatedAt ?? firstArchivedAt,
  author: organizationAuthor
    ? {
        '@type': 'Organization',
        name: organizationAuthor,
      }
    : authors
      ? authors.split(/,\s*/).slice(0, 12).map((name) => ({
        '@type': 'Person',
        name,
        }))
      : undefined,
});

export const createPersonJsonLd = ({
  name,
  url,
  description,
  sameAs = [],
}: {
  name: string;
  url: string;
  description?: string;
  sameAs?: string[];
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name,
  url,
  description,
  sameAs: sameAs.filter(Boolean),
});
