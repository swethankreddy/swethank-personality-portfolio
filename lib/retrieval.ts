// Deterministic retrieval over the compact knowledge index.
//
// No embeddings, no vector store. The corpus is 8 items; a field-weighted
// lexical ranker with IDF term weighting is more reliable here, and every
// decision it makes is inspectable (see `matchedFields` / `reasons`).
//
// Scoring, in full:
//   For each query term t and item i:
//     fieldScore(t,i) = max over fields f where t occurs in f of WEIGHT[f]
//     termScore(t,i)  = fieldScore(t,i) * idf(t)
//   score(i) = sum over t of termScore(t,i)  +  YEAR_BONUS if i.year is requested
//   idf(t)   = ln(1 + N / (1 + df(t)))   with N = corpus size, df = items containing t
//
// IDF is what makes "opencv" (2 items) outrank "ml" (4 items) — without it,
// broad tags dominate and every query returns the same items.

import { getKnowledgeIndex, type IndexItem } from './knowledge-index';

export type Intent =
  | 'single_entity'
  | 'multi_entity'
  | 'broad_category'
  | 'comparison'
  | 'timeline'
  | 'off_topic_candidate';

export interface Candidate {
  id: string;
  title: string;
  year: number;
  category: string;
  description: string;
  score: number;
  matchedFields: string[];
}

export interface RetrievalResult {
  intent: Intent;
  years: number[];
  candidates: Candidate[];
  topK: number;
}

const WEIGHT = { title: 3.0, category: 2.5, tags: 2.5, keywords: 2.0, description: 1.0 } as const;
const YEAR_BONUS = 4.0;
const SCORE_FLOOR_RATIO = 0.25; // keep candidates scoring >= 25% of the top hit

const STOP = new Set([
  'a','an','the','is','are','was','were','be','been','what','which','who','whom','whose',
  'that','this','these','those','of','on','in','to','for','with','and','or','but','as',
  'his','he','him','her','she','they','them','it','its','me','my','you','your','their',
  'about','tell','show','has','have','had','did','does','do','can','could','would','will',
  'any','anything','something','please','some','all','more','also','from','at','by','i',
]);

// Query-side vocabulary → index-side vocabulary. Keeps the index clean while
// still matching how people actually ask.
const SYNONYMS: Record<string, string[]> = {
  cv: ['computer', 'vision'],
  ml: ['machine', 'learning'],
  ai: ['ai', 'artificial', 'intelligence'],
  'computer-vision': ['computer', 'vision'],
  vision: ['vision', 'computer-vision'],
  nlp: ['language', 'text'],
  llm: ['llm', 'language', 'model'],
  dl: ['deep', 'learning'],
  'deep-learning': ['deep', 'learning'],
  neural: ['neural', 'deep', 'learning'],
  webdev: ['web', 'frontend'],
  web: ['web', 'frontend', 'creative-dev'],
  frontend: ['frontend', 'web', 'creative-dev'],
  quant: ['quant', 'finance', 'trading'],
  finance: ['finance', 'financial', 'market'],
  bio: ['bioinformatics', 'genomics', 'biology'],
  genomics: ['genomics', 'omics', 'cancer'],
  recent: ['recent'],
  latest: ['recent'],
  newest: ['recent'],
  current: ['currently', 'active'],
  currently: ['currently', 'active'],
  achievement: ['results', 'accuracy'],
  achievements: ['results', 'accuracy'],
  best: ['results', 'accuracy'],
  strongest: ['results', 'accuracy'],
};

const COMPARISON_MARKERS = ['compare', 'comparison', 'versus', ' vs ', 'difference', 'differ', 'better', 'more impressive'];
const BROAD_MARKERS = ['all ', 'projects', 'list', 'show me', 'what kind', 'types of', 'experience'];
const PLURAL_MARKERS = ['projects', 'models', 'systems', 'technologies', 'algorithms', 'datasets', 'works'];

export function normalize(text: string): string[] {
  const cleaned = text.toLowerCase().replace(/[^a-z0-9+.#\s-]/g, ' ');
  const raw = cleaned.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  for (const tok of raw) {
    const t = tok.replace(/^[-.]+|[-.]+$/g, '');
    if (!t || t.length < 2 || STOP.has(t)) continue;
    out.push(t);
    if (SYNONYMS[t]) out.push(...SYNONYMS[t]);
    // naive de-pluralisation so "projects"/"models" match singular index terms
    if (t.endsWith('s') && t.length > 3 && !t.endsWith('ss')) out.push(t.slice(0, -1));
  }
  return [...new Set(out)];
}

export function extractYears(query: string): number[] {
  const years = [...query.matchAll(/\b(20\d{2})\b/g)].map((m) => Number(m[1]));
  return [...new Set(years)];
}

export function classifyIntent(query: string, years: number[]): Intent {
  const q = ` ${query.toLowerCase()} `;
  if (COMPARISON_MARKERS.some((m) => q.includes(m))) return 'comparison';
  if (years.length > 0 || /\brecent|latest|newest|currently\b/.test(q)) return 'timeline';
  if (PLURAL_MARKERS.some((m) => q.includes(m)) || BROAD_MARKERS.some((m) => q.includes(m)))
    return 'broad_category';
  return 'single_entity';
}

/** Top-K policy per intent. Multi-entity intents must not stop at one item. */
function topKFor(intent: Intent): number {
  switch (intent) {
    case 'comparison': return 4;
    case 'broad_category': return 5;
    case 'timeline': return 6;
    case 'multi_entity': return 4;
    default: return 3;
  }
}

function fieldTexts(item: IndexItem): Record<keyof typeof WEIGHT, string> {
  return {
    title: item.title.toLowerCase(),
    category: item.category.toLowerCase().replace(/-/g, ' '),
    tags: item.tags.join(' ').toLowerCase(),
    keywords: item.keywords.join(' ').toLowerCase(),
    description: item.description.toLowerCase(),
  };
}

function buildIdf(index: IndexItem[]): Map<string, number> {
  const df = new Map<string, number>();
  for (const item of index) {
    const all = Object.values(fieldTexts(item)).join(' ');
    for (const t of new Set(normalize(all))) df.set(t, (df.get(t) ?? 0) + 1);
  }
  const N = index.length;
  const idf = new Map<string, number>();
  for (const [term, freq] of df) idf.set(term, Math.log(1 + N / (1 + freq)));
  return idf;
}

export interface SearchOptions {
  year?: number;
  category?: string;
  topK?: number;
}

export function searchIndex(query: string, options: SearchOptions = {}): RetrievalResult {
  const index = getKnowledgeIndex();
  const idf = buildIdf(index);

  const years = options.year ? [options.year] : extractYears(query);
  const intent = classifyIntent(query, years);
  const topK = options.topK ?? topKFor(intent);
  const terms = normalize(query);

  const scored = index.map((item) => {
    const fields = fieldTexts(item);
    const matched = new Set<string>();
    let score = 0;

    for (const term of terms) {
      let best = 0;
      let bestField = '';
      for (const [field, text] of Object.entries(fields) as [keyof typeof WEIGHT, string][]) {
        if (!text.includes(term)) continue;
        if (WEIGHT[field] > best) { best = WEIGHT[field]; bestField = field; }
      }
      if (best > 0) {
        score += best * (idf.get(term) ?? Math.log(1 + index.length));
        matched.add(bestField);
      }
    }

    if (years.length > 0 && years.includes(item.year)) {
      score += YEAR_BONUS;
      matched.add('year');
    }
    if (options.category && item.category === options.category) {
      score += WEIGHT.category;
      matched.add('category');
    }

    return {
      id: item.id, title: item.title, year: item.year, category: item.category,
      description: item.description,
      score: Number(score.toFixed(3)),
      matchedFields: [...matched],
    };
  });

  // A year filter is a hard constraint, not a hint.
  const pool = years.length > 0 ? scored.filter((c) => years.includes(c.year)) : scored;

  const ranked = pool
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

  const floor = ranked.length > 0 ? ranked[0].score * SCORE_FLOOR_RATIO : 0;
  const candidates = ranked.filter((c) => c.score >= floor).slice(0, topK);

  return { intent, years, candidates, topK };
}
