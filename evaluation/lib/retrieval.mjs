// Deterministic lexical ranker over the structured index.
//
// This is the offline stand-in for the routing decision the model makes when
// it reads the index and picks ids to pass to getItemDetails. It scores an
// item by term overlap against its index row, with a smaller weight on the
// detail body so that specific figures ("0.88", "94.3") still route correctly.
// No embeddings, no vector store — same design constraint as the app.

const STOP = new Set([
  'a','an','the','is','are','was','were','be','been','what','which','who','whom',
  'that','this','these','those','и','of','on','in','to','for','with','and','or',
  'his','he','him','her','she','they','it','its','me','my','you','your','about',
  'tell','show','has','have','had','did','does','do','can','could','would','any',
  'anything','something','projects','project','work','worked','built','build',
  'building','use','used','uses','using','more','most','best','strongest','done',
]);

export function tokenize(text) {
  return (text.toLowerCase().match(/[a-z0-9][a-z0-9+.#-]*/g) ?? [])
    .filter((t) => t.length > 1 && !STOP.has(t));
}

/**
 * Rank index items for a query.
 * @returns [{ id, score }] sorted desc, zero-score items dropped.
 */
export function retrieve(query, index, details = {}, k = 5) {
  const terms = tokenize(query);
  if (terms.length === 0) return [];

  const scored = index.map((item) => {
    const rowText = `${item.title} ${item.tags.join(' ')} ${item.category} ${item.id.replace(/-/g, ' ')}`;
    const rowTokens = new Set(tokenize(rowText));
    const bodyTokens = new Set(tokenize(details[item.id] ?? ''));

    let score = 0;
    for (const t of terms) {
      if (rowTokens.has(t)) score += 1.0;        // index row: primary signal
      else if (bodyTokens.has(t)) score += 0.35; // detail body: weaker signal
    }
    return { id: item.id, score: Number(score.toFixed(3)) };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, k);
}

/** Recall@K for one question: fraction of expected ids present in top-k. */
export function recallAtK(expected, retrievedIds) {
  if (expected.length === 0) return null; // off-topic / contact: not a retrieval task
  const hit = expected.filter((e) => retrievedIds.includes(e)).length;
  return hit / expected.length;
}

/** Strict accuracy: every expected id retrieved, nothing expected missed. */
export function entityMatch(expected, retrievedIds) {
  if (expected.length === 0) return retrievedIds.length === 0;
  return expected.every((e) => retrievedIds.includes(e));
}

/** Fraction of expected keywords present in the concatenated retrieved detail. */
export function keywordCoverage(keywords, retrievedIds, details) {
  if (keywords.length === 0) return null;
  const hay = retrievedIds.map((id) => details[id] ?? '').join('\n').toLowerCase();
  const hit = keywords.filter((k) => hay.includes(k.toLowerCase())).length;
  return hit / keywords.length;
}
