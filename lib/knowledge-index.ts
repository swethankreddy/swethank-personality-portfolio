// Compact retrieval index, derived from data/projects.json.
//
// This is the ONLY retrieval surface. It deliberately excludes `detail` bodies —
// those are fetched on demand via getItemDetails. Deriving from projects.json
// means the index cannot drift from the content it describes.

import { getPublishedProjects, type Project } from './data';

export interface IndexItem {
  id: string;
  title: string;
  category: string;
  year: number;
  tags: string[];
  keywords: string[];
  description: string;
  status: string;
}

const MAX_DESC = 180;

// Workspace items that do not live in projects.json.
const STATIC_INDEX_ITEMS: IndexItem[] = [
  {
    id: 'aum-ventures',
    title: 'Investment Analyst at AUM Ventures',
    category: 'experience',
    year: 2025,
    tags: ['Venture Capital', 'AI', 'Due Diligence'],
    keywords: [
      'vc', 'investor', 'investment', 'analyst', 'deep-tech', 'startups',
      'due diligence', 'market analysis', 'portfolio', 'deal flow', 'currently', 'job',
    ],
    description:
      'Investment Analyst at AUM Ventures evaluating AI and deep-tech startups: deal flow, technical due diligence, investment memos.',
    status: 'Active',
  },
];

function toIndexItem(p: Project & { workspaceId: string }): IndexItem {
  const extra = p as Project & { keywords?: string[]; category?: string };
  return {
    id: p.workspaceId,
    title: p.workspaceTitle ?? p.title,
    category: extra.category ?? 'project',
    year: p.year,
    tags: p.tags ?? [],
    keywords: extra.keywords ?? [],
    description:
      p.description.length > MAX_DESC ? `${p.description.slice(0, MAX_DESC).trimEnd()}…` : p.description,
    status: p.status,
  };
}

export function getKnowledgeIndex(): IndexItem[] {
  const fromProjects = getPublishedProjects()
    .filter((p): p is Project & { workspaceId: string } => !!p.workspaceId)
    .map(toIndexItem);
  return [...fromProjects, ...STATIC_INDEX_ITEMS];
}

export function getIndexIds(): string[] {
  return getKnowledgeIndex().map((i) => i.id);
}

/**
 * One-line catalogue summary for the system prompt. Replaces the old full
 * index table: the model no longer searches the index itself, it calls
 * searchPortfolio. This only tells it what kind of corpus exists.
 */
export function getCatalogueSummary(): string {
  const idx = getKnowledgeIndex();
  const years = [...new Set(idx.map((i) => i.year))].sort();
  const cats = [...new Set(idx.map((i) => i.category))].sort();
  return [
    `${idx.length} indexed items spanning ${years[0]}–${years[years.length - 1]}.`,
    `Categories: ${cats.join(', ')}.`,
  ].join(' ');
}
