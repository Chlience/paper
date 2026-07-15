import type { APIRoute } from 'astro';
import data from '../../generated/conference-data.json';

export const prerender = true;

const papers = data.papers.map((paper) => {
  const sourceUrl = paper.sourceUrl || '';
  const paperUrl = paper.paperUrl && paper.paperUrl !== sourceUrl ? paper.paperUrl : undefined;

  return {
    id: paper.id,
    venueId: paper.venueId,
    venueAcronym: paper.venueAcronym,
    venueName: paper.venueName,
    ccfAreaId: paper.ccfAreaId,
    title: paper.title,
    authors: paper.authors,
    authorStatus: 'authorStatus' in paper ? paper.authorStatus || undefined : undefined,
    abstractStatus: 'abstractStatus' in paper ? paper.abstractStatus || undefined : undefined,
    trackRaw: paper.trackRaw || undefined,
    presentationTypeRaw: paper.presentationTypeRaw || undefined,
    presentationTypeNormalized: paper.presentationTypeNormalized || 'unknown',
    presentationModeRaw: paper.presentationModeRaw || undefined,
    presentationModeNormalized: paper.presentationModeNormalized || 'unknown',
    recognition: paper.recognition?.length ? paper.recognition : undefined,
    domains: paper.domains,
    primaryDomainId: paper.primaryDomainId,
    contributionType: paper.contributionType,
    coreContribution: paper.coreContribution || undefined,
    classificationConfidence: paper.classificationConfidence,
    status: paper.status && paper.status !== 'active' ? paper.status : undefined,
    sourceUrl: sourceUrl || undefined,
    paperUrl,
    notePath: paper.notePath || undefined,
  };
});

export const GET: APIRoute = () =>
  new Response(JSON.stringify(papers), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
