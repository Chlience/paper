import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { getPaperSourceMetadata, renderMarkdown } from './content/markdown.mjs';

test('v3 and earlier source fields produce usable reader metadata', () => {
  const current = getPaperSourceMetadata(`## Source
- Canonical source: [paper](https://example.com/paper)
- Version / revision read: v1, Sections 1–4
- Reading scope: Main text and Appendix A.
`);
  assert.equal(current.sourceUrl, 'https://example.com/paper');
  assert.equal(current.canonicalSource, current.sourceUrl);
  assert.equal(current.currentVersion, 'v1, Sections 1–4');
  const legacy = getPaperSourceMetadata(`## Source
- arXiv: 2609.03501
- Current version read: v1
`);
  assert.equal(legacy.sourceUrl, 'https://arxiv.org/abs/2609.03501');
  assert.equal(legacy.currentVersion, 'v1');
  const fullWidth = getPaperSourceMetadata('## Source\n- Canonical source：https://example.com/paper\n- Version / revision read：v2');
  assert.equal(fullWidth.sourceUrl, 'https://example.com/paper');
  assert.equal(fullWidth.currentVersion, 'v2');
});

test('the real v3 note keeps source details and opens both sourced figures', async () => {
  const raw = await fs.readFile('content/papers/2609.03501-statistical-understanding-mixture-of-experts.md', 'utf8');
  const source = getPaperSourceMetadata(raw);
  assert.equal(source.sourceUrl, 'https://arxiv.org/abs/2609.03501');
  assert.match(source.currentVersion, /v1/);
  const html = renderMarkdown(raw, { foldPaperSource: true });
  assert.match(html, /<details[^>]*data-paper-source/);
  assert.match(html, /id="source"/);
  assert.match(html, /Reading scope:/);
  assert.match(html, /<\/details>\s*<h2 id="一句话结论"/);
  assert.equal((html.match(/data-paper-figure-open/g) ?? []).length, 2);
  assert.equal((html.match(/loading="lazy"/g) ?? []).length, 2);
  assert.equal((html.match(/width="1800"/g) ?? []).length, 2);
  assert.equal((html.match(/<figcaption[^>]*>Image Source:/g) ?? []).length, 2);
});

test('legacy figure captions and ordinary markdown keep their existing behavior', () => {
  const html = renderMarkdown('![plot](/images/papers/example/figure.png)\n\nFigure 1: Result. Image Source: https://example.com/figure.png');
  assert.match(html, /data-paper-figure-open/);
  assert.match(html, /<figcaption[^>]*>Figure 1:/);
  for (const label of ['Figure1', 'Fig.1', '图1']) {
    assert.match(renderMarkdown(`![plot](/images/papers/example/figure.png)\n\n${label}: Result.`), /data-paper-figure-open/);
  }
  const ordinary = renderMarkdown('## Source\n\nOriginal material.\n\n## Findings\n\nA result.');
  assert.doesNotMatch(ordinary, /<details/);
});
