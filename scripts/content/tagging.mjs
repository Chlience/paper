import { getFirstHeading, getSection, getSourceField, stripMarkdown } from './markdown.mjs';

const tagOverrides = new Map([
  ['2001.08361-scaling-laws-neural-language-models', ['Methodology', 'Theory']],
  ['2203.15556-training-compute-optimal-large-language-models', ['Methodology', 'Theory']],
  ['2205.14135-flashattention-io-aware-exact-attention', ['Systems', 'Theory', 'Methodology']],
  ['2310.01889-ring-attention-blockwise-transformers-near-infinite-context', ['Systems', 'Methodology', 'Theory']],
  ['2308.16369-sarathi-chunked-prefill-decode-maximal-batching', ['Systems', 'Methodology']],
  ['2025-09-10-defeating-nondeterminism-llm-inference', ['Systems', 'RL', 'Methodology']],
  ['2403.03185-correlated-proxies-reward-hacking', ['RL', 'Safety', 'Methodology']],
  ['2405.19888-parrot-semantic-variable-llm-serving', ['Systems', 'Methodology']],
  ['2409.19256-hybridflow-rlhf-framework', ['Systems', 'RL']],
  ['2501.09620-causal-rewards-llm-alignment', ['RL', 'Safety', 'Methodology']],
  ['2501.12948-deepseek-r1-rl-reasoning', ['RL', 'Safety', 'Methodology']],
  ['2503.11926-monitoring-reasoning-models-obfuscation', ['RL', 'Safety', 'Methodology']],
  ['2503.14476-dapo-long-cot-rl-system', ['RL', 'Systems', 'Methodology']],
  ['2504.13837-rlvr-reasoning-boundary-base-model', ['RL', 'Methodology']],
  ['2505.24864-prorl-prolonged-rl-reasoning-boundaries', ['RL', 'Systems', 'Methodology']],
  ['2510.01180-brorl-broadened-rl-exploration', ['RL', 'Systems', 'Methodology']],
  ['2509.25123-rl-compositional-skill-acquisition', ['RL', 'Methodology']],
  ['2511.02749-span-queries-cache-attention-locality', ['Systems', 'Methodology']],
  ['2512.07783-interplay-pretraining-midtraining-rl-reasoning', ['RL', 'Methodology']],
  ['2506.10947-spurious-rewards-rethinking-rlvr', ['RL', 'Safety', 'Methodology']],
  ['2506.19248-inference-time-reward-hacking-llms', ['RL', 'Safety', 'Methodology']],
  ['2604.04648-caution-pessimism-best-of-n-reward-hacking', ['RL', 'Safety', 'Methodology']],
  ['2510.20270-impossiblebench-test-case-exploitation', ['Safety', 'Methodology', 'Systems']],
  ['2510.19315-transformers-inherently-succinct', ['Theory']],
  ['2602.07078-optimal-token-baseline-long-horizon-llm-rl', ['RL', 'Systems', 'Methodology']],
  ['2605.14220-training-inference-mismatch-llm-rl', ['RL', 'Systems', 'Methodology']],
  ['2605.30290-self-trained-verification', ['RL', 'Methodology']],
  ['2605.31514-age-of-empires-anthropomorphism', ['Methodology']],
  ['2606.00135-agentic-tool-calling-rl-training', ['RL', 'Systems', 'Methodology']],
  ['2606.04075-llms-hack-rewards-and-society', ['Safety', 'RL']],
  ['2606.04101-ultraep-rack-scale-moe-load-balancing', ['Systems']],
  ['2606.04662-muon-outperforms-adam-curvature', ['Optimizer', 'Theory']],
]);

const parseExplicitTags = (value = '') =>
  [
    ...new Set(
      stripMarkdown(value)
        .split(/[,，;；]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ].slice(0, 5);

const inferTags = (markdown, filename) => {
  const explicitTags = parseExplicitTags(getSourceField(markdown, 'Tags'));
  if (explicitTags.length > 0) return explicitTags;

  const haystack = [
    filename,
    getSourceField(markdown, 'Title') || getFirstHeading(markdown, filename.replace(/\.md$/, '')),
    getSourceField(markdown, 'Subjects'),
    getSection(markdown, '一句话结论'),
    getSection(markdown, '主要启发'),
  ]
    .join('\n')
    .toLowerCase();
  const tags = [];
  const add = (tag, pattern) => {
    if (pattern.test(haystack)) tags.push(tag);
  };

  add('RL', /\b(rl|rlhf|rlvr|grpo|ppo|post-training|rollout|reward)\b/);
  add('Systems', /\b(serving|inference|kernel|attention|moe|vllm|sglang|verl|distributed|hybridflow|vortex|ultraep)\b/);
  add('Safety', /\b(safety|jailbreak|reward hacking|societal|risk|governance)\b/);
  add('Theory', /\b(theory|theorem|transformer|succinct|hessian|curvature|formal|automata)\b/);
  add('Optimizer', /\b(muon|adam|adamw|optimizer|shampoo|soap|galore|apollo|lion|adafactor)\b/);
  add('Methodology', /\b(methodology|anthropomorphism|verification|verifier|evaluation|benchmark)\b/);

  return [...new Set(tags)].slice(0, 5);
};

export const tagsForPaper = (slug, markdown, fileName) => tagOverrides.get(slug) ?? inferTags(markdown, fileName);
