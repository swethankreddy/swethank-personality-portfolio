// Local, dependency-free request telemetry for the chat route.
//
// Appends one JSON object per request to .observability/events.jsonl. No
// database, no external service — same constraint as the rest of the system.
// Writes are best-effort: on a read-only filesystem (Vercel) logging silently
// no-ops rather than failing the request.

import fs from 'fs';
import path from 'path';

export interface ChatEvent {
  ts: string;
  query: string;
  retrievalPath: 'search+detail' | 'search-only' | 'index-only' | 'index+detail' | 'none';
  toolsCalled: string[];
  retrievedIds: string[];
  latencyMs: number;
  contextChars: number;
  promptTokens?: number;
  completionTokens?: number;
  answerChars: number;
  success: boolean;
  error?: string;
}

const LOG_DIR = path.join(process.cwd(), '.observability');
const LOG_FILE = path.join(LOG_DIR, 'events.jsonl');
const MAX_QUERY_CHARS = 300;

export function recordChatEvent(event: ChatEvent): void {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    const safe: ChatEvent = { ...event, query: event.query.slice(0, MAX_QUERY_CHARS) };
    fs.appendFileSync(LOG_FILE, JSON.stringify(safe) + '\n', 'utf-8');
  } catch {
    // Read-only filesystem or permission issue — telemetry is never critical.
  }
}

export function readChatEvents(limit = 200): ChatEvent[] {
  try {
    const lines = fs.readFileSync(LOG_FILE, 'utf-8').trim().split('\n');
    return lines
      .slice(-limit)
      .map((l) => {
        try { return JSON.parse(l) as ChatEvent; } catch { return null; }
      })
      .filter((e): e is ChatEvent => e !== null)
      .reverse();
  } catch {
    return [];
  }
}

export interface EventStats {
  total: number;
  successRate: number | null;
  avgLatencyMs: number | null;
  p95LatencyMs: number | null;
  avgContextChars: number | null;
  avgToolCalls: number | null;
  pathCounts: Record<string, number>;
  topIds: Array<{ id: string; count: number }>;
}

export function summarize(events: ChatEvent[]): EventStats {
  if (events.length === 0) {
    return {
      total: 0, successRate: null, avgLatencyMs: null, p95LatencyMs: null,
      avgContextChars: null, avgToolCalls: null, pathCounts: {}, topIds: [],
    };
  }
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const latencies = events.map((e) => e.latencyMs).sort((a, b) => a - b);

  const pathCounts: Record<string, number> = {};
  const idCounts: Record<string, number> = {};
  for (const e of events) {
    pathCounts[e.retrievalPath] = (pathCounts[e.retrievalPath] ?? 0) + 1;
    for (const id of e.retrievedIds) idCounts[id] = (idCounts[id] ?? 0) + 1;
  }

  return {
    total: events.length,
    successRate: mean(events.map((e) => (e.success ? 1 : 0))),
    avgLatencyMs: Math.round(mean(latencies)),
    p95LatencyMs: latencies[Math.floor(latencies.length * 0.95)] ?? latencies.at(-1)!,
    avgContextChars: Math.round(mean(events.map((e) => e.contextChars))),
    avgToolCalls: Number(mean(events.map((e) => e.toolsCalled.length)).toFixed(2)),
    pathCounts,
    topIds: Object.entries(idCounts)
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
  };
}
