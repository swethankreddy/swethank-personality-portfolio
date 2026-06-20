import { getProjects, type Project } from './data';

function formatProjectDetail(p: Project): string {
  const label = p.workspaceLabel ?? 'PROJECT';
  const statusMap: Record<string, string> = {
    active: 'Active',
    completed: 'Completed',
    wip: 'In Progress',
  };
  const status = statusMap[p.status] ?? p.status;
  const d = p.detail ?? {};

  const parts: string[] = [];
  parts.push(`**${p.workspaceTitle ?? p.title}** · ${label} · ${p.year} · ${status}`);

  if (d.overview) parts.push(d.overview);
  if (d.implementation) parts.push(`Technical implementation:\n${d.implementation}`);
  if (d.challenges) parts.push(`Challenges:\n${d.challenges}`);
  if (d.results) parts.push(`Results / Impact:\n${d.results}`);

  const stack = d.techStack || p.tags.join(', ');
  if (stack) parts.push(`Stack: ${stack}`);

  if (p.github) parts.push(`GitHub: ${p.github}`);

  return parts.join('\n\n');
}

// Static detail for workspace items not stored in projects.json
const STATIC_ITEM_DETAILS: Record<string, string> = {
  'aum-ventures': `
**Investment Analyst at AUM Ventures** · EXPERIENCE · 2025 · Active

Role at AUM Ventures, an early-stage VC firm focused on AI and deep-tech:
- Deal flow: reviewing inbound pitches, sourcing investment opportunities in AI/ML, bio-tech, and adjacent areas
- Due diligence: technical assessment of products and architectures, market sizing, competitive analysis
- Investment memos: synthesizing research into structured recommendations
- Portfolio support: tracking performance of existing portfolio companies, sector monitoring
- AI focus: specifically evaluating AI-native startups, assessing model quality, moat, team, and go-to-market

Running concurrently with his research and coursework at IIT Bombay. Gives him a lens into how AI research translates to commercial products and VC theses.
`.trim(),
};

export function getItemDetail(id: string): string {
  if (id in STATIC_ITEM_DETAILS) return STATIC_ITEM_DETAILS[id];

  const project = getProjects().find((p) => p.workspaceId === id);
  if (!project) return 'No detail found for that id.';

  return formatProjectDetail(project);
}
