// Knowledge-base loader for the evaluation harness.
//
// The chatbot's retrieval surface is the "Item index" table embedded in
// lib/chat-context.ts. We parse that table straight out of the source file
// rather than re-declaring it here, so the benchmark can never drift from
// what the model actually sees.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * Build the index the way lib/knowledge-index.ts does: derived from
 * data/projects.json, plus the static workspace items declared in the TS module.
 * Parsing the static block out of the source keeps one source of truth.
 */
export function loadIndex() {
  const projects = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'data/projects.json'), 'utf-8'),
  );
  const rows = projects
    .filter((p) => p.published && p.workspaceId)
    .map((p) => ({
      id: p.workspaceId,
      category: p.category ?? 'project',
      title: p.workspaceTitle ?? p.title,
      year: p.year,
      tags: p.tags ?? [],
      keywords: p.keywords ?? [],
    }));

  // Static (non-projects.json) index items live in lib/knowledge-index.ts.
  const src = fs.readFileSync(path.join(ROOT, 'lib/knowledge-index.ts'), 'utf-8');
  for (const m of src.matchAll(/id:\s*'([a-z0-9-]+)',\s*\n\s*title:\s*'([^']+)',\s*\n\s*category:\s*'([^']+)',\s*\n\s*year:\s*(\d{4})/g)) {
    if (rows.some((r) => r.id === m[1])) continue;
    rows.push({ id: m[1], category: m[3], title: m[2], year: Number(m[4]), tags: [], keywords: [] });
  }

  if (rows.length === 0) throw new Error('Parsed zero index rows');
  return rows;
}

/** Full detail text per workspace id, used for keyword-coverage scoring. */
export function loadDetails() {
  const projects = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'data/projects.json'), 'utf-8'),
  );
  const details = {};
  for (const p of projects) {
    if (!p.workspaceId) continue;
    const d = p.detail ?? {};
    details[p.workspaceId] = [
      p.title, p.description, String(p.year), (p.tags ?? []).join(' '),
      d.overview, d.implementation, d.challenges, d.results, d.techStack,
    ].filter(Boolean).join('\n');
  }

  // Items that live outside projects.json are held as static strings in
  // lib/item-details.ts — pull them in the same parse-the-source way.
  const src = fs.readFileSync(path.join(ROOT, 'lib/item-details.ts'), 'utf-8');
  for (const m of src.matchAll(/'([a-z0-9-]+)':\s*`([\s\S]*?)`\.trim\(\)/g)) {
    details[m[1]] = (details[m[1]] ?? '') + '\n' + m[2];
  }
  return details;
}

export function loadQuestions() {
  return JSON.parse(
    fs.readFileSync(path.join(ROOT, 'evaluation/questions.json'), 'utf-8'),
  );
}

export { ROOT };
