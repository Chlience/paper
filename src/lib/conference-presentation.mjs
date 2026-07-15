export const PRESENTATION_TYPE_LABELS = Object.freeze({
  oral: 'Oral（口头报告）',
  featured: 'Spotlight / Highlight（精选展示）',
  poster: 'Poster（海报展示）',
  other: '其他',
  unknown: '未标注',
});

export const PRESENTATION_MODE_LABELS = Object.freeze({
  'in-person': 'In-person（现场）',
  virtual: 'Virtual（线上）',
  hybrid: 'Hybrid（混合）',
  'proceedings-only': 'Proceedings-only（仅收录）',
  other: '其他',
  unknown: '未标注',
});

export const PRESENTATION_TYPE_ORDER = Object.freeze([
  'oral',
  'featured',
  'poster',
  'other',
  'unknown',
]);

export const PRESENTATION_MODE_ORDER = Object.freeze([
  'in-person',
  'virtual',
  'hybrid',
  'proceedings-only',
  'other',
  'unknown',
]);

export const getPresentationTypeBadge = (paper = {}) => {
  const normalized = String(paper.presentationTypeNormalized ?? 'unknown');
  if (normalized === 'unknown') return '';
  return String(paper.presentationTypeRaw || PRESENTATION_TYPE_LABELS[normalized] || normalized);
};

export const getPresentationModeBadge = (paper = {}) => {
  const normalized = String(paper.presentationModeNormalized ?? 'unknown');
  if (normalized === 'unknown') return '';
  const raw = String(paper.presentationModeRaw ?? '').trim();
  if (raw) {
    if (normalized === 'in-person') return 'In-person';
    if (normalized === 'virtual') return 'Virtual';
    if (normalized === 'hybrid') return 'Hybrid';
    if (normalized === 'proceedings-only') return 'Proceedings-only';
    return raw;
  }
  return String(PRESENTATION_MODE_LABELS[normalized] || normalized);
};
