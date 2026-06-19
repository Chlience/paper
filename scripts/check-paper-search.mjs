import assert from 'node:assert/strict';
import { buildPaperSearchItems, searchPaperItems } from '../src/lib/paper-search.mjs';

const papers = [
  {
    title: 'FlashAttention 2: Faster Attention with Better Parallelism and Work Partitioning',
    path: '/papers/2307.08691-flashattention-2-parallelism-work-partitioning/',
    date: '2026-01-16',
    authors: 'Tri Dao',
    summary: 'Better work partitioning for exact attention kernels.',
    slug: '2307.08691-flashattention-2-parallelism-work-partitioning',
    tags: ['RL', 'Systems', 'Safety'],
  },
  {
    title: 'ZeRO: Memory Optimizations Toward Training Trillion Parameter Models',
    path: '/papers/1910.02054-zero-memory-optimizations-trillion-parameter-models/',
    date: '2026-06-18',
    authors: 'Samyam Rajbhandari, Jeff Rasley',
    summary: 'Partition optimizer states, gradients, and parameters.',
    slug: '1910.02054-zero-memory-optimizations-trillion-parameter-models',
    tags: ['RL', 'Systems', 'Optimizer'],
  },
  {
    title: 'Large Language Models Hack Rewards, and Society',
    path: '/papers/2606.04075-llms-hack-rewards-and-society/',
    date: '2026-06-02',
    authors: 'Peter Henderson',
    summary: 'RL training can exploit reward specification gaps.',
    slug: '2606.04075-llms-hack-rewards-and-society',
    tags: ['Safety', 'RL'],
  },
];

const items = buildPaperSearchItems(papers);

assert.equal(items.length, 3);
assert.deepEqual(
  Object.keys(items[0]).sort(),
  ['authors', 'date', 'path', 'searchText', 'summary', 'tags', 'title'].sort(),
);

assert.equal(searchPaperItems(items, '').length, 0);
assert.equal(searchPaperItems(items, 'flash').at(0)?.title, papers[0].title);
assert.equal(searchPaperItems(items, 'tri dao').at(0)?.path, papers[0].path);
assert.equal(searchPaperItems(items, 'optimizer partition').at(0)?.title, papers[1].title);
assert.equal(searchPaperItems(items, 'reward safety').at(0)?.title, papers[2].title);
assert.equal(searchPaperItems(items, 'missing term').length, 0);
assert.equal(searchPaperItems(items, 'rl', 2).length, 2);

console.log('Paper search check passed.');
