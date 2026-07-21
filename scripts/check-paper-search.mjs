import assert from 'node:assert/strict';
import { buildPaperSearchItems, searchPaperItems } from '../src/lib/paper-search.mjs';

const papers = [
  {
    title: 'FlashAttention 2: Faster Attention with Better Parallelism and Work Partitioning',
    path: '/papers/2307.08691-flashattention-2-parallelism-work-partitioning/',
    firstArchivedAt: '2026-01-16',
    authors: 'Tri Dao',
    coreSignal: 'Better work partitioning for exact attention kernels.',
    conclusion: 'The method changes warp allocation while preserving exact attention outputs.',
    slug: '2307.08691-flashattention-2-parallelism-work-partitioning',
    tags: ['Attention Kernel'],
    tagAliases: ['FlashAttention', 'attention IO'],
  },
  {
    title: 'ZeRO: Memory Optimizations Toward Training Trillion Parameter Models',
    path: '/papers/1910.02054-zero-memory-optimizations-trillion-parameter-models/',
    firstArchivedAt: '2026-06-18',
    authors: 'Samyam Rajbhandari, Jeff Rasley',
    coreSignal: 'Partition optimizer states, gradients, and parameters.',
    conclusion: 'Each data-parallel rank stores only its assigned training states.',
    slug: '1910.02054-zero-memory-optimizations-trillion-parameter-models',
    tags: ['Training Memory', 'Distributed Training'],
    tagAliases: ['optimizer state sharding'],
  },
  {
    title: 'Large Language Models Hack Rewards, and Society',
    path: '/papers/2606.04075-llms-hack-rewards-and-society/',
    firstArchivedAt: '2026-06-02',
    authors: 'Peter Henderson',
    coreSignal: 'RL training can exploit reward specification gaps.',
    conclusion: 'Societal rules encoded as rewards can create exploitable proxy objectives.',
    slug: '2606.04075-llms-hack-rewards-and-society',
    tags: ['Reward Hacking', 'AI Safety'],
    tagAliases: ['specification gaming'],
  },
];

const items = buildPaperSearchItems(papers);

assert.equal(items.length, 3);
assert.deepEqual(
  Object.keys(items[0]).sort(),
  ['authors', 'coreSignal', 'firstArchivedAt', 'path', 'searchText', 'tags', 'title'].sort(),
);

assert.equal(searchPaperItems(items, '').length, 0);
assert.equal(searchPaperItems(items, 'flash').at(0)?.title, papers[0].title);
assert.equal(searchPaperItems(items, 'tri dao').at(0)?.path, papers[0].path);
assert.equal(searchPaperItems(items, 'optimizer partition').at(0)?.title, papers[1].title);
assert.equal(searchPaperItems(items, 'data-parallel assigned').at(0)?.title, papers[1].title);
assert.equal(searchPaperItems(items, 'reward safety').at(0)?.title, papers[2].title);
assert.equal(searchPaperItems(items, 'specification gaming').at(0)?.title, papers[2].title);
assert.equal(searchPaperItems(items, 'missing term').length, 0);
assert.equal(searchPaperItems(items, 'training', 2).length, 2);

console.log('Paper search check passed.');
