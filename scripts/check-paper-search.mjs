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

const mainlines = [
  {
    slug: 'llm-agent-rl-credit-assignment',
    title: 'LLM 与 Agent 强化学习中的信用分配',
    path: '/mainlines/llm-agent-rl-credit-assignment/',
    firstArchivedAt: '2026-07-13 16:58',
    researchQuestion: '稀疏回报如何分配到工具调用、记忆和策略角色？',
    coreSignal: '按信用单元、识别信号、分配算子、可比性条件和策略角色配置比较方法。',
    boundary: '跨论文分数不作直接排名。',
    currentJudgment: '多策略生成与专用估值角色需要分开审计。',
    classificationAxes: ['信用单元', '策略角色配置'],
  },
];

const items = buildPaperSearchItems(papers, mainlines);

assert.equal(items.length, 4);
assert.deepEqual(
  Object.keys(items[0]).sort(),
  ['authors', 'contentType', 'coreSignal', 'firstArchivedAt', 'path', 'searchText', 'tags', 'title', 'typeLabel'].sort(),
);

assert.equal(searchPaperItems(items, '').length, 0);
assert.equal(searchPaperItems(items, 'flash').at(0)?.title, papers[0].title);
assert.equal(searchPaperItems(items, 'tri dao').at(0)?.path, papers[0].path);
assert.equal(searchPaperItems(items, 'optimizer partition').at(0)?.title, papers[1].title);
assert.equal(searchPaperItems(items, 'data-parallel assigned').at(0)?.title, papers[1].title);
assert.equal(searchPaperItems(items, 'reward safety').at(0)?.title, papers[2].title);
assert.equal(searchPaperItems(items, 'specification gaming').at(0)?.title, papers[2].title);
assert.equal(searchPaperItems(items, '策略角色配置').at(0)?.path, mainlines[0].path);
assert.equal(searchPaperItems(items, '稀疏回报 工具调用').at(0)?.contentType, 'mainline');
assert.equal(searchPaperItems(items, 'missing term').length, 0);
assert.equal(searchPaperItems(items, 'training', 2).length, 2);

console.log('Paper search check passed.');
