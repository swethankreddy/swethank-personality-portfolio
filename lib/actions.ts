'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { randomUUID } from 'crypto';
import { isAdminAuthenticated, setAdminCookie, clearAdminCookie } from '@/lib/auth';
import {
  saveWritingPost,
  deleteWritingPost,
  getWritingById,
  saveProject,
  deleteProject,
  getProjectById,
  type ProjectDetail,
  saveResearch,
  deleteResearch,
  saveExperience,
  deleteExperience,
  saveCurrentStatus,
  type WritingPost,
  type Project,
  type ResearchEntry,
  type ExperienceEntry,
} from '@/lib/data';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function loginAction(formData: FormData) {
  const password = formData.get('password') as string;
  const ok = await setAdminCookie(password);
  if (!ok) redirect('/admin/login?error=1');
  redirect('/admin');
}

export async function logoutAction() {
  await clearAdminCookie();
  redirect('/admin/login');
}

// ── Writing ──────────────────────────────────────────────────────────────────

export async function createWritingAction(formData: FormData) {
  if (!(await isAdminAuthenticated())) redirect('/admin/login');

  const title = (formData.get('title') as string).trim();
  const excerpt = (formData.get('excerpt') as string).trim();
  const content = (formData.get('content') as string).trim();
  const tags = (formData.get('tags') as string)
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  const published = formData.get('published') === 'on';

  const post: WritingPost = {
    id: randomUUID(),
    slug: slugify(title),
    title,
    date: new Date().toISOString(),
    excerpt,
    content,
    tags,
    published,
  };

  saveWritingPost(post);
  revalidatePath('/writing');
  redirect('/admin/writing');
}

export async function updateWritingAction(formData: FormData) {
  if (!(await isAdminAuthenticated())) redirect('/admin/login');

  const id = (formData.get('id') as string).trim();
  const existing = getWritingById(id);
  if (!existing) redirect('/admin/writing');

  const title = (formData.get('title') as string).trim();
  const excerpt = (formData.get('excerpt') as string).trim();
  const content = (formData.get('content') as string).trim();
  const tags = (formData.get('tags') as string)
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  const published = formData.get('published') === 'on';

  const post: WritingPost = {
    ...existing,
    title,
    slug: slugify(title),
    excerpt,
    content,
    tags,
    published,
  };

  saveWritingPost(post);
  revalidatePath('/writing');
  revalidatePath('/admin/writing');
  redirect('/admin/writing');
}

export async function deleteWritingAction(formData: FormData) {
  if (!(await isAdminAuthenticated())) redirect('/admin/login');
  const id = formData.get('id') as string;
  deleteWritingPost(id);
  revalidatePath('/writing');
  revalidatePath('/admin/writing');
}

// ── Projects ─────────────────────────────────────────────────────────────────

function parseDetail(formData: FormData): ProjectDetail | undefined {
  const overview = (formData.get('detail_overview') as string | null)?.trim() ?? '';
  const implementation = (formData.get('detail_implementation') as string | null)?.trim() ?? '';
  const challenges = (formData.get('detail_challenges') as string | null)?.trim() ?? '';
  const results = (formData.get('detail_results') as string | null)?.trim() ?? '';
  const techStack = (formData.get('detail_techStack') as string | null)?.trim() ?? '';

  if (!overview && !implementation && !challenges && !results && !techStack) return undefined;

  return {
    overview: overview || undefined,
    implementation: implementation || undefined,
    challenges: challenges || undefined,
    results: results || undefined,
    techStack: techStack || undefined,
  };
}

export async function createProjectAction(formData: FormData) {
  if (!(await isAdminAuthenticated())) redirect('/admin/login');

  const title = (formData.get('title') as string).trim();
  const description = (formData.get('description') as string).trim();
  const year = parseInt(formData.get('year') as string, 10) || new Date().getFullYear();
  const tags = (formData.get('tags') as string)
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  const link = (formData.get('link') as string).trim();
  const github = (formData.get('github') as string).trim();
  const demo = (formData.get('demo') as string).trim();
  const status = (formData.get('status') as Project['status']) || 'completed';
  const published = formData.get('published') === 'on';
  const featured = formData.get('featured') === 'on';

  const project: Project = {
    id: randomUUID(),
    title,
    description,
    year,
    tags,
    link,
    github: github || undefined,
    demo: demo || undefined,
    status,
    published,
    featured: featured || undefined,
    detail: parseDetail(formData),
  };

  saveProject(project);
  revalidatePath('/projects');
  redirect('/admin/projects');
}

export async function updateProjectAction(formData: FormData) {
  if (!(await isAdminAuthenticated())) redirect('/admin/login');

  const id = (formData.get('id') as string).trim();
  const existing = getProjectById(id);
  if (!existing) redirect('/admin/projects');

  const title = (formData.get('title') as string).trim();
  const description = (formData.get('description') as string).trim();
  const year = parseInt(formData.get('year') as string, 10) || existing.year;
  const tags = (formData.get('tags') as string)
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  const link = (formData.get('link') as string).trim();
  const github = (formData.get('github') as string).trim();
  const demo = (formData.get('demo') as string).trim();
  const status = (formData.get('status') as Project['status']) || existing.status;
  const published = formData.get('published') === 'on';
  const featured = formData.get('featured') === 'on';

  const project: Project = {
    ...existing,
    title,
    description,
    year,
    tags,
    link,
    github: github || undefined,
    demo: demo || undefined,
    status,
    published,
    featured: featured || undefined,
    detail: parseDetail(formData),
  };

  saveProject(project);
  revalidatePath('/projects');
  revalidatePath('/admin/projects');
  redirect('/admin/projects');
}

export async function deleteProjectAction(formData: FormData) {
  if (!(await isAdminAuthenticated())) redirect('/admin/login');
  const id = formData.get('id') as string;
  deleteProject(id);
  revalidatePath('/projects');
  revalidatePath('/admin/projects');
}

// ── Research ─────────────────────────────────────────────────────────────────

export async function createResearchAction(formData: FormData) {
  if (!(await isAdminAuthenticated())) redirect('/admin/login');

  const title = (formData.get('title') as string).trim();
  const abstract = (formData.get('abstract') as string).trim();
  const year = parseInt(formData.get('year') as string, 10) || new Date().getFullYear();
  const venue = (formData.get('venue') as string).trim();
  const status = (formData.get('status') as ResearchEntry['status']) || 'in-progress';
  const tags = (formData.get('tags') as string)
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  const link = (formData.get('link') as string).trim();
  const published = formData.get('published') === 'on';

  const entry: ResearchEntry = {
    id: randomUUID(),
    title,
    abstract,
    year,
    venue,
    status,
    tags,
    link,
    published,
  };

  saveResearch(entry);
  redirect('/admin/research');
}

export async function deleteResearchAction(formData: FormData) {
  if (!(await isAdminAuthenticated())) redirect('/admin/login');
  const id = formData.get('id') as string;
  deleteResearch(id);
  revalidatePath('/admin/research');
}

// ── Experience ───────────────────────────────────────────────────────────────

export async function createExperienceAction(formData: FormData) {
  if (!(await isAdminAuthenticated())) redirect('/admin/login');

  const company = (formData.get('company') as string).trim();
  const role = (formData.get('role') as string).trim();
  const startDate = (formData.get('startDate') as string).trim();
  const endDate = (formData.get('endDate') as string).trim();
  const description = (formData.get('description') as string).trim();
  const skills = (formData.get('skills') as string)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const order = parseInt(formData.get('order') as string, 10) || 99;

  const entry: ExperienceEntry = {
    id: randomUUID(),
    company,
    role,
    startDate,
    endDate,
    description,
    skills,
    order,
  };

  saveExperience(entry);
  redirect('/admin/experience');
}

export async function deleteExperienceAction(formData: FormData) {
  if (!(await isAdminAuthenticated())) redirect('/admin/login');
  const id = formData.get('id') as string;
  deleteExperience(id);
  revalidatePath('/admin/experience');
}

// ── Current Status ────────────────────────────────────────────────────────────

export async function updateCurrentStatusAction(formData: FormData) {
  if (!(await isAdminAuthenticated())) redirect('/admin/login');

  const sentences: string[] = [];
  for (let i = 0; i < 4; i++) {
    const val = formData.get(`sentence_${i}`);
    const s = typeof val === 'string' ? val.trim() : '';
    if (s) sentences.push(s);
  }

  saveCurrentStatus(sentences);
  revalidatePath('/');
  revalidatePath('/admin');
  redirect('/admin/settings');
}
