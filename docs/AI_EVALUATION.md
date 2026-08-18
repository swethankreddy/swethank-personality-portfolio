# AI Evaluation & Observability

How the portfolio chatbot's retrieval is measured, why it is built the way it is,
and what the numbers currently are.

All figures in this document come from actual runs. Nothing here is estimated.

---

## 1. Architecture: old vs new

### Old (baseline)

The full item index was embedded in the system prompt and **the model did the
retrieval itself** — it read the table, picked ids, and called `getItemDetails`.

```
QUERY → [LLM reads index in prompt, picks ids] → getItemDetails(id) → answer
```

Measured failure mode: **average 1.00 items retrieved per question**. The prompt
told the model to fetch every relevant item; it almost always stopped after one.
Every multi-entity question (comparison, broad search) lost recall as a result.
Timeline questions failed outright because the index rows carried no year.

### New

Retrieval is a deterministic tool. The model no longer searches.

```
QUERY
  → searchPortfolio(query, year?, category?)     deterministic ranker, no LLM
  → ranked candidate ids + intent + count
  → getItemDetails(id) for EACH candidate        evidence fetch
  → showReference(id) per item discussed         UI highlight
  → answer generated ONLY from fetched evidence
```

The system prompt no longer contains the item list at all — only a one-line
catalogue summary (`8 indexed items spanning 2024–2025. Categories: …`) so the
model knows what kind of corpus exists. Ids come exclusively from the tool.

### Why still no embeddings

The corpus is 8 items. A vector store would add an embedding pipeline, a store,
and re-indexing on every content edit, in exchange for semantic generalisation we
can partly buy with a synonym map. The deterministic ranker is auditable — every
result carries `matchedFields` and a score you can reproduce by hand — and it
made Recall@5 94.4%. Criterion 12 of the brief is met: structured retrieval was
*not* shown to be insufficient, so no vector DB was introduced.

At roughly 50+ items, or when synonym maintenance outgrows its value, this flips.

## 2. Retrieval algorithm

Implemented in `lib/retrieval.ts`, exposed at `GET /api/search?q=…` so it is
testable without the LLM.

**Index fields** (`lib/knowledge-index.ts`, derived from `data/projects.json`):
`id, title, category, year, tags, keywords, description, status`. Detail bodies
are deliberately excluded — they are fetched on demand.

**Scoring**

```
fieldScore(t,i) = max over fields f containing t of WEIGHT[f]
termScore(t,i)  = fieldScore(t,i) × idf(t)
score(i)        = Σ termScore(t,i)  +  YEAR_BONUS if i.year ∈ requested years
idf(t)          = ln(1 + N / (1 + df(t)))
```

| Field | Weight |
|---|---|
| title | 3.0 |
| category | 2.5 |
| tags | 2.5 |
| keywords | 2.0 |
| description | 1.0 |
| exact year match | +4.0 |

IDF is what stops broad tags dominating: `opencv` (2 items) outranks `ml` (4 items).

**Normalisation** — lowercase, punctuation stripped, naive de-pluralisation, and
a synonym map (`cv → computer vision`, `dl → deep learning`, `web → frontend`).

**Intent classification** sets top-K, which is the actual fix for multi-entity
recall:

| Intent | Trigger | top-K |
|---|---|---|
| `comparison` | compare, versus, difference, better | 4 |
| `broad_category` | plural nouns, "show me", "list" | 5 |
| `timeline` | a year, or recent/latest/currently | 6 |
| `single_entity` | default | 3 |

A year in the query is a **hard filter**, not a hint. Candidates below 25% of the
top score are dropped, so a narrow question still returns one item.

## 3. Evaluation methodology

### Benchmark

`evaluation/questions.json` — 50 questions across 7 categories:

| Category | Count | Tests |
|---|---|---|
| `technical_detail` | 17 | stack and metric lookups |
| `project_search` | 10 | discovery by theme |
| `off_topic` | 7 | refusal behaviour |
| `experience` | 5 | non-project items |
| `timeline` | 4 | year-scoped queries |
| `comparison` | 4 | multi-entity retrieval |
| `contact` | 3 | link-surfacing |

Each entry declares `expected_entities` (workspace ids that must be retrieved)
and `expected_keywords` (strings that must appear in the retrieved detail).

### Two modes

- **Offline** (`node evaluation/run-eval.mjs`) — scores a deterministic lexical
  ranker over the same index the model sees. Free, instant, no API calls. Measures
  *index quality*: is the routing information even present in the rows.
- **Live** (`node evaluation/run-eval.mjs --live`) — POSTs each question to
  `/api/chat`, parses the SSE stream, and extracts the ids the model actually
  passed to `getItemDetails` / `showReference`. Measures *system behaviour*.

The benchmark parses the index straight out of `lib/chat-context.ts`, so it can
never drift from what the model is actually given.

### Metrics

- **Recall@K** — fraction of expected ids present in the retrieved set.
- **Entity accuracy** — strict: every expected id retrieved, and for off-topic
  questions nothing retrieved at all.
- **Keyword coverage** — fraction of expected keywords appearing in the
  concatenated detail of retrieved items. Catches "right item, wrong content".
- **Context grounding rate** — does the answer echo a title or tag of something
  it retrieved.
- **Unsupported numbers** — numeric figures asserted in the answer that appear
  nowhere in the retrieved detail. This is the hallucination guard.
- **Off-topic refusal rate** — did the bot decline instead of answering.

### Why no LLM judge

Every check above is a string or set operation: free, deterministic, and
reproducible across runs. An LLM judge would add cost and variance to a signal
that deterministic checks already capture at this scale. The one thing they
cannot assess is answer *fluency*, which is not the failure mode that matters
for a factual portfolio bot.

## 4. Observability

`lib/observability.ts` appends one JSON object per chat request to
`.observability/events.jsonl` (gitignored, no database):

```json
{ "ts": "...", "query": "...", "retrievalPath": "index+detail",
  "toolsCalled": ["getItemDetails","showReference"], "retrievedIds": ["multi-agent"],
  "latencyMs": 6023, "contextChars": 4334, "promptTokens": 1885,
  "completionTokens": 124, "answerChars": 283, "success": true }
```

Wired into `streamText`'s `onFinish` / `onError` in `app/api/chat/route.ts`.
Writes are best-effort and no-op on a read-only filesystem.

Rendered at **`/admin/observability`** (behind the existing admin cookie):
success rate, avg and p95 latency, avg context size, retrieval-path distribution,
most-retrieved items, and the last 200 requests.

## 5. Measured results — before vs after

Both runs: same 50 questions, same benchmark file, live against the real
application on a local dev server, `gemini-2.5-flash`. Expected answers were
fixed before either run. Rate limiting was disabled for the *after* run only
because the 60/day dev cap voided a first attempt (43/50 returned HTTP 429); the
harness now aborts loudly on transport errors rather than scoring them.

| Metric | Before | After | Δ |
|---|---|---|---|
| Retrieval Recall@5 | 80.4% | **94.4%** | **+14.0** |
| Entity accuracy | 75.0% | **87.5%** | **+12.5** |
| Keyword coverage | 81.4% | **90.7%** | **+9.3** |
| Avg retrieved entities | 1.00 | **1.52** | **+0.52** |
| Off-topic refusal | 71.4% | **100%** | **+28.6** |
| Context grounding | 94.3% | **100%** | **+5.7** |
| Unsupported numbers | 0/50 | **0/50** | — |
| Avg latency | 4,615 ms | **5,854 ms** | **+1,239 (worse)** |
| p95 latency | 9,073 ms | 9,073 ms | — |
| Context reduction | 61.4% | **57.9%** | **−3.5 (worse)** |
| Avg prompt tokens | 1,870 | **2,474** | **+604 (worse)** |

Offline (retrieval layer alone, no LLM): Recall@5 86.5% → **92.5%**, entity
accuracy 80.0% → **87.5%**.

### The trade-off, stated plainly

Retrieval quality improved substantially. **Context efficiency and latency got
worse**, and that was predictable: the pipeline now makes an extra tool
round-trip, and it fetches 1.52 items per question instead of 1.00. More evidence
in context is the direct cause of both the better recall and the worse token
count. Context reduction fell from 61.4% to 57.9% against a wholesale-injection
baseline of 14,363 chars.

If token cost mattered more than recall, the lever is top-K, not the architecture.

## 6. Remaining failures

5 of 40 retrieval questions still fail. All are inspectable in
`evaluation/results/live-latest.json` under `failure_reason`.

| Reason | Count | Example |
|---|---|---|
| `retrieval_miss` | 3 | "What are his strongest achievements?" — "achievements" maps to results/accuracy, which are in `detail`, not the index |
| `ranking_order` | 2 | "Tell me about his deep learning experience" — 5 candidates returned, `gesture-recognition` ranked 6th |

Specific open issues:

1. **Superlative and evaluative queries** ("strongest achievements", "best
   measurable result") need metrics that live in `detail`, which is deliberately
   outside the index. Fixing this means either indexing a `highlights` field or
   accepting the miss.
2. **"Currently"** retrieves `aum-ventures` but misses `cancer-omics`. `status`
   exists on index items but is not yet a scored field.
3. **"Most recent project"** has no year token, so the year filter never fires.
   Recency ranking is not implemented — deliberately, since implementing it *after*
   seeing the benchmark would be fitting to the test set.
4. **Latency is the real cost.** avg 5.9 s, and this is a local dev server.
5. Off-topic refusal reached 100% on 7 adversarial prompts — a small sample.

## 7. Running it

```bash
npm run dev                                # required for BOTH modes

node evaluation/run-eval.mjs               # offline: scores GET /api/search only, no LLM calls
node evaluation/run-eval.mjs --live        # live: full pipeline through POST /api/chat
node evaluation/run-eval.mjs --live --limit 10 --k 3

curl 'localhost:3000/api/search?q=computer+vision'   # inspect retrieval directly
```

The dev cap is 60 chat requests/day per IP. A 50-question live run will trip it if
anything else has used the quota — comment out `UPSTASH_REDIS_REST_*` in
`.env.local` for a clean run, and restore them afterwards. The harness reports
`transport_errors` and refuses to present metrics as valid when any are non-zero.

Results are written to `evaluation/results/{offline,live}-latest.json`.
