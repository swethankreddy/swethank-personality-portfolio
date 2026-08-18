// Deterministic response-quality checks. No LLM judge — every check here is a
// string/set operation so the harness stays free, fast, and reproducible.

import { tokenize } from './retrieval.mjs';

const REFUSAL_MARKERS = [
  'only answer', 'only discuss', "can't help", 'cannot help', 'not something',
  'outside', 'unrelated', "don't have", 'do not have', 'no information',
  "isn't in", 'not in swethank', 'stick to', 'about swethank',
];

/**
 * Unsupported-claim heuristic: numeric figures asserted in the answer that
 * appear nowhere in the retrieved detail. Catches invented metrics, which is
 * the failure mode that matters most for a portfolio bot.
 */
export function unsupportedNumbers(answer, retrievedIds, details) {
  const hay = retrievedIds.map((id) => details[id] ?? '').join('\n');
  const nums = answer.match(/\d+(?:\.\d+)?%?/g) ?? [];
  return [...new Set(nums)].filter((n) => {
    if (/^(19|20)\d{2}$/.test(n)) return false;   // years are in the index
    if (n.replace('%', '').length < 2) return false; // ignore list numbering
    return !hay.includes(n.replace('%', ''));
  });
}

/** Does the answer actually draw on retrieved context (title or tag echo)? */
export function referencesContext(answer, retrievedIds, index) {
  if (retrievedIds.length === 0) return null;
  const a = answer.toLowerCase();
  return retrievedIds.some((id) => {
    const item = index.find((i) => i.id === id);
    if (!item) return false;
    const titleTokens = tokenize(item.title);
    return (
      titleTokens.some((t) => a.includes(t)) ||
      item.tags.some((t) => a.includes(t.toLowerCase()))
    );
  });
}

/** For off-topic questions: did the bot decline instead of answering? */
export function refusedOffTopic(answer) {
  const a = answer.toLowerCase();
  return REFUSAL_MARKERS.some((m) => a.includes(m));
}
