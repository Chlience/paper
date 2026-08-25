import assert from 'node:assert/strict';
import test from 'node:test';
import * as authors from './content/authors.mjs';
import * as workflow from './content/paper-workflow.mjs';
import { archiveIndex, archiveRow, v21Paper } from './fixtures/paper-workflow.mjs';

test('author references combine profile links with source author names', () => {
  const references = authors.collectAuthorReferences(
    [
      '## 作者与关系',
      '',
      '- [Ada Example](/authors/ada-example/): Example University.',
      '',
      '## 跨论文关系',
      '',
      '- Related work by [External Author](/authors/external-author/).',
    ].join('\n'),
    'Bob Example, Carol Example',
  );

  assert.deepEqual([...references.slugs], ['ada-example']);
  assert.deepEqual([...references.authorSlugs], []);
  assert.deepEqual([...references.authorLinkKeysBySlug], []);
  assert.deepEqual([...references.keys], ['bob example', 'carol example']);
  assert.equal(authors.authorProfileIsReferenced({ slug: 'ada-example', name: 'Ada Example' }, references), true);
  assert.equal(
    authors.authorProfileIsReferenced(
      { slug: 'robert-example', name: 'Robert Example', aliases: ['Bob Example'] },
      references,
    ),
    true,
  );
});

test('explicit author matching only accepts links in the Source Authors field', () => {
  const linkedReferences = authors.collectAuthorReferences(
    [
      '## Source',
      '',
      '- Authors: [Xi Wang](/authors/xi-wang-jhu/), Ada Example',
      '',
      '## 作者与关系',
      '',
      '- [External Author](/authors/external-author/): collaborator.',
    ].join('\n'),
    'Xi Wang, Ada Example',
  );
  const nameOnlyReferences = authors.collectAuthorReferences(
    '## Source\n\n- Authors: Xi Wang, Ada Example',
    'Xi Wang, Ada Example',
  );
  const relationOnlyReferences = authors.collectAuthorReferences(
    [
      '## Source',
      '',
      '- Authors: Xi Wang, Ada Example',
      '',
      '## 作者与关系',
      '',
      '- [Xi Wang](/authors/xi-wang-jhu/): related identity.',
    ].join('\n'),
    'Xi Wang, Ada Example',
  );
  const mismatchedReferences = authors.collectAuthorReferences(
    '## Source\n\n- Authors: [Ada Example](/authors/xi-wang-jhu/)',
    'Ada Example',
  );
  const profile = { slug: 'xi-wang-jhu', name: 'Xi Wang', matchByName: false };

  assert.deepEqual([...linkedReferences.authorSlugs], ['xi-wang-jhu']);
  assert.deepEqual(
    [...linkedReferences.authorLinkKeysBySlug].map(([slug, keys]) => [slug, [...keys]]),
    [['xi-wang-jhu', ['xi wang']]],
  );
  assert.equal(authors.authorProfileIsReferenced(profile, linkedReferences), true);
  assert.equal(authors.authorProfileIsReferenced(profile, nameOnlyReferences), false);
  assert.equal(authors.authorProfileIsReferenced(profile, relationOnlyReferences), false);
  assert.equal(authors.authorProfileIsReferenced(profile, mismatchedReferences), false);
});

test('orphan author audit ignores linked and aliased profiles and reports true orphans', () => {
  const records = [
    {
      slug: 'linked-paper',
      markdown: [
        '## Source',
        '',
        '- Authors: Bob Example',
        '',
        '## 作者与关系',
        '',
        '- [Ada Example](/authors/ada-example/): Example University.',
      ].join('\n'),
    },
  ];
  const profiles = [
    { slug: 'ada-example', name: 'Ada Example' },
    { slug: 'robert-example', name: 'Robert Example', aliases: ['Bob Example'] },
    { slug: 'orphan-author', name: 'Orphan Author' },
  ];

  const issues = workflow.findOrphanAuthorProfiles(records, profiles);

  assert.deepEqual(issues.map((issue) => issue.subject), ['orphan-author']);
  assert.equal(issues[0].code, 'orphan-author-profile');
});

test('archive collection audit combines index and author reverse-integrity errors', () => {
  const records = [
    {
      slug: 'echo',
      markdown: '## Source\n\n- Authors: Ada Example\n\n## 作者与关系\n\n- Ada Example: Example University.',
    },
  ];
  const result = workflow.validateArchiveCollections({
    records,
    profiles: [
      { slug: 'ada-example', name: 'Ada Example' },
      { slug: 'orphan-author', name: 'Orphan Author' },
    ],
    indexMarkdown: archiveIndex([archiveRow('echo', 'ECHO')]),
    knownPaperSlugs: new Set(['echo', 'missing-paper']),
  });

  assert.ok(result.errors.some((issue) => issue.code === 'missing-index-entry'));
  assert.ok(result.errors.some((issue) => issue.code === 'orphan-author-profile'));
});

test('archive-core accepts plain-text authors without creating profiles', () => {
  const result = workflow.validateArchiveCollections({
    records: [{ slug: 'v21-note', markdown: v21Paper }],
    profiles: [],
    indexMarkdown: archiveIndex([archiveRow('v21-note', 'V2.1')]),
    knownPaperSlugs: new Set(['v21-note']),
  });

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.advisories, []);
});

test('author aliases cannot resolve to two different profiles', () => {
  const profiles = [
    { slug: 'ada-example', name: 'Ada Example', aliases: ['A. Example'] },
    { slug: 'bob-example', name: 'Bob Example', aliases: ['A. Example'] },
  ];
  const result = workflow.validateAuthorProfiles(profiles);
  assert.ok(result.errors.some((issue) => issue.code === 'author-identity-conflict'));
});

test('author profile slugs must be unique', () => {
  const profiles = [
    { slug: 'shared-slug', name: 'Ada Example' },
    { slug: 'shared-slug', name: 'Bob Example' },
  ];
  const result = workflow.validateAuthorProfiles(profiles);
  assert.ok(result.errors.some((issue) => issue.code === 'author-slug-conflict'));
});

test('author profile links must be absolute URLs', () => {
  const profiles = [{ slug: 'ada-example', name: 'Ada Example', homepage: 'invalid-homepage' }];
  const result = workflow.validateAuthorProfiles(profiles);
  assert.ok(result.errors.some((issue) => issue.code === 'author-profile-url'));
});

test('author profile links reject incomplete HTTP URLs', () => {
  const profiles = [{ slug: 'ada-example', name: 'Ada Example', homepage: 'https://' }];
  const result = workflow.validateAuthorProfiles(profiles);
  assert.ok(result.errors.some((issue) => issue.code === 'author-profile-url'));
});

test('author profiles require an object with a slug and name', () => {
  let result;
  assert.doesNotThrow(() => {
    result = workflow.validateAuthorProfiles([null, { aliases: [] }]);
  });
  assert.ok(result.errors.some((issue) => issue.code === 'author-profile-shape'));
  assert.ok(result.errors.some((issue) => issue.code === 'author-slug'));
  assert.ok(result.errors.some((issue) => issue.code === 'author-name'));
});

test('author aliases, sources, and representative papers must remain arrays', () => {
  const profiles = [
    {
      slug: 'ada-example',
      name: 'Ada Example',
      aliases: 'A. Example',
      sources: { label: 'Homepage', url: 'https://example.com/ada' },
      representativePapers: 'A Representative Paper',
    },
  ];
  const result = workflow.validateAuthorProfiles(profiles);
  assert.ok(result.errors.some((issue) => issue.code === 'author-aliases-shape'));
  assert.ok(result.errors.some((issue) => issue.code === 'author-sources-shape'));
  assert.ok(result.errors.some((issue) => issue.code === 'author-representative-papers-shape'));
});

test('author matchByName must remain boolean', () => {
  const profiles = [{ slug: 'ada-example', name: 'Ada Example', matchByName: 'false' }];
  const result = workflow.validateAuthorProfiles(profiles);
  assert.ok(result.errors.some((issue) => issue.code === 'author-match-by-name-shape'));
});

test('author evidence sources must contain absolute URLs', () => {
  const profiles = [
    {
      slug: 'ada-example',
      name: 'Ada Example',
      sources: [{ label: 'Homepage', url: 'invalid-source' }],
    },
  ];
  const result = workflow.validateAuthorProfiles(profiles);
  assert.ok(result.errors.some((issue) => issue.code === 'author-source-url'));
});

test('author evidence accepts URL strings and labeled source objects', () => {
  const profiles = [
    {
      slug: 'ada-example',
      name: 'Ada Example',
      sources: [
        'https://example.com/paper',
        { label: 'Homepage', url: 'https://example.com/ada' },
      ],
    },
  ];
  const result = workflow.validateAuthorProfiles(profiles);
  assert.ok(!result.errors.some((issue) => issue.code === 'author-source-url'));
});

test('author representative papers accept the homepage-backed contract', () => {
  const profiles = [
    {
      slug: 'ada-example',
      name: 'Ada Example',
      homepage: 'https://example.com/ada',
      representativePapers: [
        {
          title: 'A Representative Paper',
          url: 'https://arxiv.org/abs/2601.00001',
          year: 2026,
          venue: 'Example Conference',
        },
      ],
      sources: [{ label: 'Homepage', url: 'https://example.com/ada' }],
    },
  ];
  const result = workflow.validateAuthorProfiles(profiles);
  assert.ok(!result.errors.some((issue) => issue.code.startsWith('author-representative-paper')));
});

test('author representative papers require homepage evidence in sources', () => {
  const profiles = [
    {
      slug: 'ada-example',
      name: 'Ada Example',
      homepage: 'https://example.com/ada',
      representativePapers: [
        {
          title: 'A Representative Paper',
          url: 'https://arxiv.org/abs/2601.00001',
        },
      ],
      sources: [{ label: 'Paper', url: 'https://arxiv.org/abs/2601.00001' }],
    },
  ];
  const result = workflow.validateAuthorProfiles(profiles);
  assert.ok(result.errors.some((issue) => issue.code === 'author-representative-papers-source'));
});

test('author representative papers reject missing provenance, malformed fields, and duplicates', () => {
  const profiles = [
    {
      slug: 'ada-example',
      name: 'Ada Example',
      representativePapers: [
        {
          title: '',
          url: 'invalid-paper',
          year: '2026',
          venue: '',
        },
        {
          title: 'Duplicate Paper',
          url: 'https://arxiv.org/abs/2601.00001',
        },
        {
          title: 'Duplicate Paper',
          url: 'https://arxiv.org/abs/2601.00002',
        },
      ],
    },
  ];
  const result = workflow.validateAuthorProfiles(profiles);
  for (const code of [
    'author-representative-papers-homepage',
    'author-representative-paper-title',
    'author-representative-paper-url',
    'author-representative-paper-year',
    'author-representative-paper-venue',
    'author-representative-paper-duplicate',
  ]) {
    assert.ok(result.errors.some((issue) => issue.code === code), `Missing ${code}`);
  }
});

test('author profile data must be a JSON array', () => {
  let result;
  assert.doesNotThrow(() => {
    result = workflow.validateAuthorProfiles({});
  });
  assert.ok(result.errors.some((issue) => issue.code === 'authors-shape'));
});

test('recurring unprofiled authors are reported once', () => {
  const records = [
    { slug: 'one', markdown: '## Source\n\n- Authors: Ada Example, Bob Example' },
    { slug: 'two', markdown: '## Source\n\n- Authors: Bob Example, Carol Example' },
  ];
  const issues = workflow.findRecurringUnprofiled(records, [{ slug: 'ada-example', name: 'Ada Example' }]);
  assert.deepEqual(issues.map((issue) => issue.subject), ['Bob Example']);
});
