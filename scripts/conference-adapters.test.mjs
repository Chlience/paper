import assert from 'node:assert/strict';
import test from 'node:test';
import {
  adaptAcl,
  adaptCvpr,
  adaptIcml,
  parseCvprScheduleAuthors,
} from './conferences/adapters.mjs';
import {
  cleanUsenixAbstract,
  csvRecords,
  decodeHtml,
  parseAclAnthologyMods,
  parseAsplosProgram,
  parseCvfOpenAccess,
  parseUsenixProgram,
} from './conferences/source-utils.mjs';

test('HTML decoding handles nested and conference-specific named entities', () => {
  assert.equal(
    decodeHtml(
      'M&amp;uuml;ller &amp;#x27; &amp;quot; &auml;&ouml;&ograve;&eacute;&cacute; &frasl;&middot;&alpha;&isin;&rarr;&le;&infin;&sigma;&epsilon;&copy;',
    ),
    `Müller ' " äöòéć ⁄·α∈→≤∞σε©`,
  );
});

test('CSV parsing preserves quoted newlines and locates a non-leading header', () => {
  const csv = 'notice,,,,\nPaper number,Title,Abstract\n42-MAIN,"A title","Line one\nline two"\n';
  assert.deepEqual(csvRecords(csv, 'Paper number'), [
    { 'Paper number': '42-MAIN', Title: 'A title', Abstract: 'Line one\nline two' },
  ]);
});

test('ACL Anthology MODS parsing keeps long-paper records and skips the proceedings entry', () => {
  const xml = `<modsCollection>
    <mods ID="acl-2026-long"><titleInfo><title>Proceedings</title></titleInfo><location><url>https://aclanthology.org/2026.acl-long.0/</url></location></mods>
    <mods ID="lovelace-2026-engine"><titleInfo><title>A &amp; B</title></titleInfo>
      <name type="personal"><namePart type="given">Ada</namePart><namePart type="family">Lovelace</namePart><role><roleTerm>author</roleTerm></role></name>
      <location><url>https://aclanthology.org/2026.acl-long.42/</url></location></mods>
  </modsCollection>`;
  assert.deepEqual(parseAclAnthologyMods(xml), [
    {
      officialId: '2026.acl-long.42',
      title: 'A & B',
      authors: ['Ada Lovelace'],
      paperUrl: 'https://aclanthology.org/2026.acl-long.42/',
      pdfUrl: 'https://aclanthology.org/2026.acl-long.42.pdf',
    },
  ]);
});

test('CVF Open Access parsing extracts stable proceedings links and authors', () => {
  const html = `<dt class="ptitle"><br><a href="/content/CVPR2026/html/Li_Test_CVPR_2026_paper.html">Test &amp; Verify</a></dt>
    <dd><form><input type="hidden" name="query_author" value="Ada Lovelace"></form>
    <form><input type="hidden" name="query_author" value="Alan Turing"></form></dd>`;
  assert.deepEqual(parseCvfOpenAccess(html, 'https://openaccess.thecvf.com/CVPR2026?day=all'), [
    {
      officialId: 'Li_Test_CVPR_2026',
      title: 'Test & Verify',
      authors: ['Ada Lovelace', 'Alan Turing'],
      paperUrl: 'https://openaccess.thecvf.com/content/CVPR2026/html/Li_Test_CVPR_2026_paper.html',
      pdfUrl: 'https://openaccess.thecvf.com/content/CVPR2026/papers/Li_Test_CVPR_2026_paper.pdf',
    },
  ]);
});

test('ASPLOS program parsing keeps paper authors while dropping affiliations', () => {
  const html = `<div class="paper">
    <div class="paper-title">A Fast System</div>
    <div class="paper-authors">Ada Lovelace (Analytical Engine Lab), Alan Turing (Bletchley Park)</div>
  </div>`;
  const [paper] = parseAsplosProgram(html, 'https://example.com/program/');
  assert.equal(paper.title, 'A Fast System');
  assert.deepEqual(paper.authors, ['Ada Lovelace', 'Alan Turing']);
  assert.equal(paper.presentationRaw, 'Oral');
});

test('USENIX parsing filters schedule talks without research-paper authors', () => {
  const html = `<article id="node-42" class="node node-paper view-mode-schedule">
    <h2><a href="/conference/security26/presentation/lovelace">Secure Engines</a></h2>
    <div class="field field-name-field-paper-people-text field-type-text-long field-label-hidden"><div><div class="field-item odd"><p>Ada Lovelace, <em>Engine Lab;</em> Alan Turing, <em>Computing Lab</em></p></div></div></div>
    <div class="field field-name-field-paper-description-long field-type-text-long field-label-hidden"><p>We present a secure engine.</p></div>
  </article>
  <article id="node-43" class="node node-paper view-mode-schedule"><h2>Enigma talk</h2></article>`;
  const papers = parseUsenixProgram(html, 'https://www.usenix.org/conference/security26/technical-sessions');
  assert.equal(papers.length, 1);
  assert.deepEqual(papers[0].authors, ['Ada Lovelace', 'Alan Turing']);
  assert.match(papers[0].abstract, /secure engine/);
  assert.equal(papers[0].paperUrl, 'https://www.usenix.org/conference/security26/presentation/lovelace');
});

test('USENIX parsing drops hidden embargoed authors and distinguishes available abstracts', () => {
  const html = `<article id="node-44" class="node node-paper view-mode-schedule">
    <h2><a href="/conference/security26/presentation/hidden">Paper Title Under Embargo</a></h2>
    <div class="field field-name-field-paper-people-text field-type-text-long field-label-hidden"><div><div class="field-item odd"><p>Author list under embargo.</p><!--<p>Hidden Person, <em>Hidden Lab</em></p>--></div></div></div>
    <div class="field field-name-field-paper-description-long field-type-text-long field-label-hidden"><p>This paper is currently under embargo. The final paper PDF and abstract will be available on the first day of the conference.</p></div>
  </article>
  <article id="node-45" class="node node-paper view-mode-schedule">
    <h2><a href="/conference/security26/presentation/available">Available Abstract</a></h2>
    <div class="field field-name-field-paper-people-text field-type-text-long field-label-hidden"><div><div class="field-item odd"><p>Ada Lovelace, <em>Engine Lab</em></p></div></div></div>
    <div class="field field-name-field-paper-description-long field-type-text-long field-label-hidden"><p>This paper is currently under embargo, but the paper abstract is available now. The final paper PDF will be available on the first day of the conference.</p><p>We present the available abstract.</p></div>
  </article>`;
  const papers = parseUsenixProgram(html, 'https://www.usenix.org/conference/security26/technical-sessions');
  assert.equal(papers[0].authorStatus, 'embargoed');
  assert.deepEqual(papers[0].authors, []);
  assert.equal(papers[0].abstractStatus, 'embargoed');
  assert.equal(papers[0].abstract, '');
  assert.deepEqual(papers[1].authors, ['Ada Lovelace']);
  assert.equal(papers[1].abstractStatus, undefined);
  assert.equal(papers[1].abstract, 'We present the available abstract.');
});

test('USENIX abstract cleanup only removes the available-abstract preamble', () => {
  assert.deepEqual(
    cleanUsenixAbstract(
      '<p>This paper is currently under embargo, but the paper abstract is available now. The final paper PDF will be available on the first day of the conference.</p><p>Real abstract.</p>',
    ),
    { abstract: 'Real abstract.', abstractStatus: '' },
  );
});

test('ACL adapter joins Main roster with official presentation schedule', async () => {
  const result = await adaptAcl({
    getText: async (url) =>
      url.includes('spreadsheets')
        ? 'Paper number,Title,Abstract,Session,Underline/Whova Session Name\n42-MAIN,A Paper,We propose a method.,S1,Orals Session A: NLP\n'
        : `<modsCollection><mods ID="a-paper"><titleInfo><title>A Paper</title></titleInfo>
          <name type="personal"><namePart type="given">Ada</namePart><namePart type="family">Lovelace</namePart><role><roleTerm>author</roleTerm></role></name>
          <location><url>https://aclanthology.org/2026.acl-long.42/</url></location></mods></modsCollection>`,
  });
  assert.equal(result.papers[0].presentationRaw, 'Oral');
  assert.equal(result.papers[0].abstract, 'We propose a method.');
  assert.equal(result.maxUnknownPresentationCount, 25);
});

test('ACL adapter safely fuzzy-matches spelling and TeX title variants and preserves virtual presentations', async () => {
  const roster = `<modsCollection>
    <mods ID="paper-1"><titleInfo><title>A Robust Method for Cross-Lingual Language Model Training</title></titleInfo>
      <name type="personal"><namePart type="given">Ada</namePart><namePart type="family">Lovelace</namePart><role><roleTerm>author</roleTerm></role></name>
      <location><url>https://aclanthology.org/2026.acl-long.1/</url></location></mods>
    <mods ID="paper-2"><titleInfo><title>L2M: A $\\LaTeX$-Aware Parser for Robust Multilingual NLP</title></titleInfo>
      <name type="personal"><namePart type="given">Alan</namePart><namePart type="family">Turing</namePart><role><roleTerm>author</roleTerm></role></name>
      <location><url>https://aclanthology.org/2026.acl-long.2/</url></location></mods>
  </modsCollection>`;
  const schedule = `Paper number,Title,Abstract,Session,Underline/Whova Session Name
1-MAIN,A Robust Method for Cross Lingual Language Models Training,First abstract.,S1,Virtual Presentations
2-MAIN,L2M A LaTeX Aware Parsers for Robust Multilingual NLP,Second abstract.,S2,Poster Session A
`;
  const result = await adaptAcl({
    getText: async (url) => (url.includes('spreadsheets') ? schedule : roster),
  });
  assert.equal(result.papers[0].abstract, 'First abstract.');
  assert.equal(result.papers[0].presentationRaw, 'Virtual');
  assert.equal(result.papers[1].abstract, 'Second abstract.');
  assert.equal(result.papers[1].presentationRaw, 'Poster');
});

test('CVPR schedule author fallback removes affiliation metadata while preserving people named Blank', () => {
  assert.deepEqual(
    parseCvprScheduleAuthors(
      'Ada Lovelace, Studios; ETH Zurich 0000-0003-4012-6292, Camila Blank, Nils Blank, Allen AI blank',
    ),
    ['Ada Lovelace', 'Camila Blank', 'Nils Blank'],
  );
});

test('CVPR adapter enriches the official proceedings roster with presentation metadata', async () => {
  const openAccess = `<dt class="ptitle"><br><a href="/content/CVPR2026/html/Li_Test_CVPR_2026_paper.html">A &amp; B</a></dt><dd><input type="hidden" name="query_author" value="Ada Lovelace"><input type="hidden" name="query_author" value="Allen AI blank"></dd>`;
  const events = {
    results: [
      {
        id: 7,
        sourceid: 42,
        name: 'A and B',
        event_type: 'Poster',
        decision: 'Accept (Highlight)',
        paper_pdf_url: 'https://openaccess.thecvf.com/content/CVPR2026/html/Li_Test_CVPR_2026_paper.html',
      },
    ],
  };
  const schedule =
    'Poster Session #,Session Order,Paper ID,Title,Authors,Oral Paper,Award Candidate,Highlight Paper\nPoster Session 1,1,42,A & B,"Schedule Person, Studios blank",,,yes\n';
  const result = await adaptCvpr({
    getText: async (url) => (url.includes('spreadsheets') ? schedule : openAccess),
    getJson: async (url) => (url.includes('abstracts') ? { 7: 'We introduce a benchmark.' } : events),
  });
  assert.equal(result.papers[0].presentationRaw, 'Highlight');
  assert.equal(result.papers[0].abstract, 'We introduce a benchmark.');
  assert.equal(result.papers[0].publicationStatus, 'published');
  assert.deepEqual(result.papers[0].authors, ['Ada Lovelace']);
  assert.equal(result.minPublishedCount, 4_000);
});

test('ICML adapter merges oral events and excludes independent position papers', async () => {
  const conference = 'https://openreview.net/group?id=ICML.cc/2026/Conference';
  const result = await adaptIcml({
    getJson: async (url) =>
      url.includes('abstracts')
        ? { 1: 'We propose an efficient learner.', 4: 'We present a virtual paper.' }
        : {
            results: [
              {
                id: 1,
                name: 'Efficient Learning',
                authors: [{ fullname: 'Ada Lovelace' }],
                event_type: 'Poster',
                decision: 'Accept (spotlight)',
                sourceurl: conference,
                paper_url: 'https://openreview.net/forum?id=paper42',
              },
              {
                id: 2,
                name: 'Efficient Learning',
                authors: [{ fullname: 'Ada Lovelace' }],
                event_type: 'Oral',
                decision: 'Accept (spotlight)',
                sourceurl: conference,
                paper_url: '',
              },
              {
                id: 3,
                name: 'A Position Paper',
                authors: [{ fullname: 'Grace Hopper' }],
                event_type: 'Poster',
                decision: 'Accept (regular)',
                sourceurl: 'https://openreview.net/group?id=ICML.cc/2026/Position_Paper_Track',
                paper_url: 'https://openreview.net/forum?id=position7',
              },
              {
                id: 4,
                sourceid: 84,
                name: 'A &amp; B',
                authors: [{ fullname: 'M&amp;uuml;ller' }],
                event_type: 'Poster',
                decision: 'Accept (regular)',
                sourceurl: conference,
                paper_url: '',
                virtualsite_url: '/virtual/2026/poster/84',
              },
            ],
          },
  });
  assert.equal(result.papers.length, 2);
  const reviewed = result.papers.find((paper) => paper.officialId === 'paper42');
  const virtual = result.papers.find((paper) => paper.officialId === '84');
  assert.equal(reviewed.presentationRaw, 'Oral');
  assert.equal(virtual.paperUrl, 'https://icml.cc/virtual/2026/poster/84');
  assert.equal(virtual.pdfUrl, '');
  assert.equal(virtual.title, 'A & B');
  assert.deepEqual(virtual.authors, ['Müller']);
});
