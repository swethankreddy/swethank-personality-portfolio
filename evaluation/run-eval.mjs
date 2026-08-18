#!/usr/bin/env node
// Portfolio chatbot evaluation harness.
//
//   node evaluation/run-eval.mjs            offline — lexical retrieval baseline
//   node evaluation/run-eval.mjs --live     end-to-end against a running dev server
//   node evaluation/run-eval.mjs --live --limit 10
//
// Offline mode measures the index: can the structured rows route a question to
// the right items at all. Live mode measures the deployed system: what the
// model actually retrieves via getItemDetails/showReference, plus latency.

import fs from 'node:fs';
import path from 'node:path';
import { loadIndex, loadDetails, loadQuestions, ROOT } from './lib/kb.mjs';
import { recallAtK, entityMatch, keywordCoverage } from './lib/retrieval.mjs';
import { unsupportedNumbers, referencesContext, refusedOffTopic } from './lib/checks.mjs';

const args = process.argv.slice(2);
const LIVE = args.includes('--live');
const K = Number(args[args.indexOf('--k') + 1]) || 5;
const LIMIT = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : Infinity;
const ENDPOINT = process.env.EVAL_ENDPOINT ?? 'http://localhost:3000/api/chat';
const SEARCH_ENDPOINT = process.env.EVAL_SEARCH_ENDPOINT ?? 'http://localhost:3000/api/search';

/** Offline: hit the deterministic retrieval endpoint. No LLM involved. */
async function searchOnly(question) {
  const res = await fetch(`${SEARCH_ENDPOINT}?q=${encodeURIComponent(question)}`);
  if (!res.ok) return { candidates: [], intent: 'error' };
  return res.json();
}

/** Why did this question fail? Deterministic classification, no guesswork. */
function classifyFailure(row, searchIds) {
  if (row.error) return 'request_error';
  const missing = row.expected_entities.filter((e) => !row.retrieved.includes(e));
  if (row.category === 'off_topic') return 'off_topic_detection';
  if (row.retrieved.length === 0 && searchIds.length === 0) return 'retrieval_miss';
  if (row.retrieved.length === 0 && searchIds.length > 0) return 'tool_routing';
  const foundBySearch = missing.filter((m) => searchIds.includes(m));
  if (foundBySearch.length > 0) return 'insufficient_detail_fetch';
  if (missing.length > 0 && searchIds.length >= row.expected_entities.length) return 'ranking_order';
  if (missing.length > 0) return 'retrieval_miss';
  return 'other';
}

const index = loadIndex();
const details = loadDetails();
const questions = loadQuestions().slice(0, LIMIT);

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const pct = (x) => (x === null ? 'n/a' : `${(x * 100).toFixed(1)}%`);

/** Live call: POST to the real route, parse the SSE stream for tool calls + text. */
async function askLive(question) {
  const started = Date.now();
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ id: `eval-${Date.now()}`, role: 'user', parts: [{ type: 'text', text: question }] }],
    }),
  });
  if (!res.ok) {
    return { error: `HTTP ${res.status}`, latencyMs: Date.now() - started, retrieved: [], searchCandidates: [], answer: '' };
  }

  const raw = await res.text();
  let ttfbMs = null;
  const retrieved = new Set();
  const searchCandidates = new Set();
  let answer = '';

  for (const line of raw.split('\n')) {
    if (!line.startsWith('data: ')) continue;
    const payload = line.slice(6).trim();
    if (payload === '[DONE]') continue;
    let evt;
    try { evt = JSON.parse(payload); } catch { continue; }

    if (evt.type === 'tool-input-available' || evt.type === 'tool-call') {
      const id = evt.input?.id ?? evt.args?.id;
      if (id) retrieved.add(id);
    }
    // searchPortfolio's OUTPUT carries the ranked candidates the model was given.
    if (evt.type === 'tool-output-available' && evt.output?.candidates) {
      for (const c of evt.output.candidates) searchCandidates.add(c.id);
    }
    if (evt.type === 'text-delta' && typeof evt.delta === 'string') {
      if (ttfbMs === null) ttfbMs = Date.now() - started;
      answer += evt.delta;
    }
  }
  return {
    retrieved: [...retrieved], searchCandidates: [...searchCandidates],
    answer, latencyMs: Date.now() - started, ttfbMs,
  };
}

const results = [];
for (const q of questions) {
  let live = null;
  let searchIds = [];
  if (LIVE) {
    live = await askLive(q.question);
    searchIds = live.searchCandidates;
    process.stdout.write('.');
  } else {
    const s = await searchOnly(q.question);
    searchIds = (s.candidates ?? []).map((c) => c.id);
  }

  const retrievedIds = LIVE ? live.retrieved : searchIds;
  const row = {
    question: q.question,
    category: q.category,
    expected_entities: q.expected_entities,
    retrieved: retrievedIds,
    recall_at_k: recallAtK(q.expected_entities, retrievedIds),
    entity_match: entityMatch(q.expected_entities, retrievedIds),
    keyword_coverage: keywordCoverage(q.expected_keywords, retrievedIds, details),
    search_candidates: searchIds,
    missing_entities: q.expected_entities.filter((e) => !retrievedIds.includes(e)),
  };
  if (LIVE) {
    row.latency_ms = live.latencyMs;
    row.ttfb_ms = live.ttfbMs;
    row.answer_chars = live.answer.length;
    row.unsupported_numbers = unsupportedNumbers(live.answer, retrievedIds, details);
    row.references_context = referencesContext(live.answer, retrievedIds, index);
    row.refused = q.category === 'off_topic' ? refusedOffTopic(live.answer) : null;
    if (live.error) row.error = live.error;
  }
  if (!entityMatch(q.expected_entities, retrievedIds)) {
    row.failure_reason = classifyFailure(row, searchIds);
  }
  results.push(row);
}
if (LIVE) process.stdout.write('\n');

const errored = results.filter((r) => r.error).length;
if (errored > 0) {
  console.error(`\n!! ${errored}/${results.length} requests failed at transport level (e.g. 429 rate limit).`);
  console.error('   Metrics below are NOT valid. Disable rate limiting and re-run.\n');
}

const retrievalRows = results.filter((r) => r.expected_entities.length > 0);
const offTopicRows = results.filter((r) => r.category === 'off_topic');

const summary = {
  mode: LIVE ? 'live' : 'offline',
  transport_errors: errored,
  generated_at: new Date().toISOString(),
  k: K,
  questions_tested: results.length,
  retrieval_questions: retrievalRows.length,
  recall_at_k: mean(retrievalRows.map((r) => r.recall_at_k)),
  entity_accuracy: mean(retrievalRows.map((r) => (r.entity_match ? 1 : 0))),
  keyword_coverage: mean(results.map((r) => r.keyword_coverage).filter((v) => v !== null)),
  avg_retrieved_entities: mean(results.map((r) => r.retrieved.length)),
};
if (LIVE) {
  const lat = results.map((r) => r.latency_ms).filter(Boolean).sort((a, b) => a - b);
  summary.avg_latency_ms = Math.round(mean(lat) ?? 0);
  summary.p95_latency_ms = lat.length ? lat[Math.floor(lat.length * 0.95)] : null;
  summary.avg_ttfb_ms = Math.round(mean(results.map((r) => r.ttfb_ms).filter(Boolean)) ?? 0);
  summary.off_topic_refusal_rate = mean(offTopicRows.map((r) => (r.refused ? 1 : 0)));
  summary.answers_with_unsupported_numbers = results.filter(
    (r) => (r.unsupported_numbers ?? []).length > 0,
  ).length;
  summary.context_grounding_rate = mean(
    results.map((r) => r.references_context).filter((v) => v !== null).map((v) => (v ? 1 : 0)),
  );
}

const failures = results.filter((r) => !r.entity_match && r.failure_reason);
summary.failure_breakdown = failures.reduce((acc, f) => {
  acc[f.failure_reason] = (acc[f.failure_reason] ?? 0) + 1;
  return acc;
}, {});

console.log('\nEvaluation Results');
console.log('-------------------');
console.log(`Mode:                    ${summary.mode}`);
console.log(`Questions tested:        ${summary.questions_tested}`);
console.log(`Retrieval questions:     ${summary.retrieval_questions}`);
console.log('');
console.log(`Retrieval Recall@${K}:      ${pct(summary.recall_at_k)}`);
console.log(`Entity Accuracy:         ${pct(summary.entity_accuracy)}`);
console.log(`Keyword Coverage:        ${pct(summary.keyword_coverage)}`);
console.log(`Avg retrieved entities:  ${summary.avg_retrieved_entities?.toFixed(2)}`);
if (LIVE) {
  console.log('');
  console.log(`Avg latency:             ${summary.avg_latency_ms} ms`);
  console.log(`p95 latency:             ${summary.p95_latency_ms} ms`);
  console.log(`Avg time to first token: ${summary.avg_ttfb_ms} ms`);
  console.log(`Off-topic refusal rate:  ${pct(summary.off_topic_refusal_rate)}`);
  console.log(`Context grounding rate:  ${pct(summary.context_grounding_rate)}`);
  console.log(`Unsupported-number answers: ${summary.answers_with_unsupported_numbers}`);
}

if (failures.length) {
  console.log(`\nFailed examples (${failures.length}):`);
  failures.slice(0, 12).forEach((f, i) => {
    console.log(`${i + 1}. [${f.failure_reason}] ${f.question}`);
    console.log(`   Expected:  ${f.expected_entities.join(', ') || '(none)'}`);
    console.log(`   Retrieved: ${f.retrieved.join(', ') || '(none)'}`);
    console.log(`   Missing:   ${f.missing_entities.join(', ') || '(none)'}`);
    console.log(`   Search gave: ${f.search_candidates.join(', ') || '(none)'}`);
  });
  console.log('\nFailure breakdown:');
  for (const [k, v] of Object.entries(summary.failure_breakdown)) console.log(`  ${k}: ${v}`);
}

const outDir = path.join(ROOT, 'evaluation/results');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `${summary.mode}-latest.json`);
fs.writeFileSync(outFile, JSON.stringify({ summary, results }, null, 2));
console.log(`\nSaved: ${path.relative(ROOT, outFile)}`);
