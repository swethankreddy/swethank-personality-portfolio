import fs from 'fs';
import path from 'path';

export interface WritingPost {
  id: string;
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  tags: string[];
  published: boolean;
}

export interface WorkspaceCard {
  readonly id: string;
  readonly label: string;
  readonly title: string;
  readonly year: number;
  readonly tags: readonly string[];
  readonly description: string;
  readonly status: string;
  readonly github?: string;
}

export interface ProjectDetail {
  overview?: string;
  implementation?: string;
  challenges?: string;
  results?: string;
  techStack?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  year: number;
  tags: string[];
  link: string;
  github?: string;
  demo?: string;
  status: 'active' | 'completed' | 'wip';
  published: boolean;
  featured?: boolean;
  // Workspace panel fields — when set, this project appears as a chat context card
  workspaceId?: string;
  workspaceLabel?: 'PROJECT' | 'RESEARCH' | 'EXPERIENCE';
  workspaceTitle?: string;
  // Rich detail content for the project detail panel and chatbot
  detail?: ProjectDetail;
}

export interface ResearchEntry {
  id: string;
  title: string;
  abstract: string;
  year: number;
  venue: string;
  status: 'published' | 'under-review' | 'in-progress';
  tags: string[];
  link: string;
  published: boolean;
}

export interface ExperienceEntry {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
  skills: string[];
  order: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');

function readJSON<T>(filename: string): T[] {
  const filePath = path.join(DATA_DIR, filename);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T[];
  } catch {
    return [];
  }
}

function writeJSON<T>(filename: string, data: T[]): void {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ── Writing ──────────────────────────────────────────────────────────────────

export function getWriting(): WritingPost[] {
  return readJSON<WritingPost>('writing.json');
}

export function getPublishedWriting(): WritingPost[] {
  return getWriting()
    .filter((p) => p.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getWritingBySlug(slug: string): WritingPost | undefined {
  return getWriting().find((p) => p.slug === slug);
}

export function getWritingById(id: string): WritingPost | undefined {
  return getWriting().find((p) => p.id === id);
}

export function saveWritingPost(post: WritingPost): void {
  const posts = getWriting();
  const idx = posts.findIndex((p) => p.id === post.id);
  if (idx >= 0) {
    posts[idx] = post;
  } else {
    posts.push(post);
  }
  writeJSON('writing.json', posts);
}

export function deleteWritingPost(id: string): void {
  const posts = getWriting().filter((p) => p.id !== id);
  writeJSON('writing.json', posts);
}

// ── Projects ─────────────────────────────────────────────────────────────────

export function getProjects(): Project[] {
  return readJSON<Project>('projects.json');
}

export function getPublishedProjects(): Project[] {
  return getProjects()
    .filter((p) => p.published)
    .sort((a, b) => b.year - a.year);
}

// Non-project workspace items (experiences) that appear in the chat panel
// but don't live in projects.json.
const WORKSPACE_EXPERIENCE_ITEMS: WorkspaceCard[] = [
  {
    id: 'aum-ventures',
    label: 'EXPERIENCE',
    title: 'Investment Analyst',
    year: 2025,
    tags: ['Venture Capital', 'AI', 'Due Diligence'],
    description:
      'Investment Analyst at AUM Ventures, focusing on AI-related investment opportunities. Conducting market analysis, due diligence, and portfolio company research.',
    status: 'Active',
  },
];

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
  wip: 'In Progress',
};

export function getWorkspaceCards(): WorkspaceCard[] {
  const projectCards = getPublishedProjects()
    .filter((p): p is Project & { workspaceId: string } => !!p.workspaceId)
    .map((p): WorkspaceCard => ({
      id: p.workspaceId,
      label: p.workspaceLabel ?? 'PROJECT',
      title: p.workspaceTitle ?? p.title,
      year: p.year,
      tags: p.tags,
      description: p.description,
      status: STATUS_LABEL[p.status] ?? p.status,
      github: p.github || undefined,
    }));
  return [...projectCards, ...WORKSPACE_EXPERIENCE_ITEMS];
}

export function getProjectById(id: string): Project | undefined {
  return getProjects().find((p) => p.id === id);
}

export function saveProject(project: Project): void {
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === project.id);
  if (idx >= 0) {
    projects[idx] = project;
  } else {
    projects.push(project);
  }
  writeJSON('projects.json', projects);
}

export function deleteProject(id: string): void {
  const projects = getProjects().filter((p) => p.id !== id);
  writeJSON('projects.json', projects);
}

// ── Research ─────────────────────────────────────────────────────────────────

export function getResearch(): ResearchEntry[] {
  return readJSON<ResearchEntry>('research.json');
}

export function getResearchById(id: string): ResearchEntry | undefined {
  return getResearch().find((r) => r.id === id);
}

export function saveResearch(entry: ResearchEntry): void {
  const research = getResearch();
  const idx = research.findIndex((r) => r.id === entry.id);
  if (idx >= 0) {
    research[idx] = entry;
  } else {
    research.push(entry);
  }
  writeJSON('research.json', research);
}

export function deleteResearch(id: string): void {
  const research = getResearch().filter((r) => r.id !== id);
  writeJSON('research.json', research);
}

// ── Experience ───────────────────────────────────────────────────────────────

export function getExperience(): ExperienceEntry[] {
  return readJSON<ExperienceEntry>('experience.json').sort(
    (a, b) => a.order - b.order
  );
}

export function getExperienceById(id: string): ExperienceEntry | undefined {
  return getExperience().find((e) => e.id === id);
}

export function saveExperience(entry: ExperienceEntry): void {
  const experience = getExperience();
  const idx = experience.findIndex((e) => e.id === entry.id);
  if (idx >= 0) {
    experience[idx] = entry;
  } else {
    experience.push(entry);
  }
  writeJSON('experience.json', experience);
}

export function deleteExperience(id: string): void {
  const experience = getExperience().filter((e) => e.id !== id);
  writeJSON('experience.json', experience);
}

// ── Current Status ────────────────────────────────────────────────────────────

export function getCurrentStatus(): string[] {
  const filePath = path.join(DATA_DIR, 'current.json');
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as string[];
  } catch {
    return [];
  }
}

export function saveCurrentStatus(sentences: string[]): void {
  const filePath = path.join(DATA_DIR, 'current.json');
  fs.writeFileSync(filePath, JSON.stringify(sentences, null, 2), 'utf-8');
}
