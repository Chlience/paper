import assert from 'node:assert/strict';
import test from 'node:test';
import { matchesDirectoryQuery, paginateDirectory } from '../src/lib/directory.mjs';

test('directory queries combine terms and support Chinese text', () => {
  assert.equal(matchesDirectoryQuery('Bo Zheng 郑波 Alibaba', 'bo 郑波'), true);
  assert.equal(matchesDirectoryQuery('Bo Zheng Alibaba', 'bo tencent'), false);
  assert.equal(matchesDirectoryQuery('任意条目', '  '), true);
});

test('directory pagination reaches every matching item without duplication', () => {
  const items = Array.from({ length: 53 }, (_, index) => index);
  const pages = [1, 2, 3].map((page) => paginateDirectory(items, page));
  assert.deepEqual(pages.flatMap((page) => page.items), items);
  assert.deepEqual(pages.map((page) => page.items.length), [24, 24, 5]);
  assert.equal(paginateDirectory(items, 100).page, 3);
  assert.equal(paginateDirectory(items, -1).page, 1);
  assert.equal(paginateDirectory(items, NaN).page, 1);
  assert.deepEqual(paginateDirectory([], 2), { items: [], page: 1, pageCount: 1, total: 0 });
});
