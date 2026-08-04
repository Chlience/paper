import assert from 'node:assert/strict';
import test from 'node:test';
import * as markdown from './content/markdown.mjs';

const { stripPublicPaperMaintenance } = markdown;

test('public paper sanitizer retains the v2 not-found review classification', () => {
  const cleaned = stripPublicPaperMaintenance(`## OpenReview / 审稿意见吸收

- Page type: not-found
- xConfidence: not-found
`);

  assert.match(cleaned, /Page type: not-found/);
  assert.doesNotMatch(cleaned, /xConfidence/);
});

test('public utility sanitizer removes repository-only maintenance blocks', () => {
  const source = `公开说明。

<!-- public-utility-omit:start -->
npm run check:dist
<!-- public-utility-omit:end -->

继续公开说明。`;

  const sanitized = markdown.stripPublicUtilityMaintenance(source);
  assert.doesNotMatch(sanitized, /npm run/i);
  assert.doesNotMatch(sanitized, /public-utility-omit/);
  assert.match(sanitized, /公开说明。/);
  assert.match(sanitized, /继续公开说明。/);
});

test('the maintenance exemption accepts canonical v2 and v2.1 review status lines', () => {
  assert.equal(typeof markdown.isPublicPaperMaintenanceExemption, 'function');
  assert.equal(markdown.isPublicPaperMaintenanceExemption?.('- Page type: not-found'), true);
  assert.equal(
    markdown.isPublicPaperMaintenanceExemption?.(
      '- Review status: page-type=not-found; match-confidence=high; observed-at=2026-07-17; venue-status=arXiv preprint',
    ),
    true,
  );
  assert.equal(markdown.isPublicPaperMaintenanceExemption?.('-\n Page type: not-found'), false);
  assert.equal(markdown.isPublicPaperMaintenanceExemption?.('- Page type:\nnot-found'), false);
  assert.equal(markdown.isPublicPaperMaintenanceExemption?.('- Review status: page-type=not-found'), false);
  assert.equal(markdown.isPublicPaperMaintenanceExemption?.('- xConfidence: not-found'), false);
});
