import { getPublishedWriting, getCurrentStatus } from './data';
import { getCatalogueSummary } from './knowledge-index';

export function getChatContext(): string {
  const writing = getPublishedWriting();
  const status = getCurrentStatus();
  const catalogue = getCatalogueSummary();

  const writingIndex =
    writing.length > 0
      ? writing.map((w) => `- "${w.title}" (${w.date.slice(0, 10)})`).join('\n')
      : '- No articles published yet.';

  return `
# Swethank Reddy

Bio: IIT Bombay undergrad (B.Tech). Builder at the intersection of AI systems, computational biology, and financial ML. Also does motion design.
Contact: swethankreddy@iitb.ac.in · GitHub: github.com/swethankreddy · LinkedIn: linkedin.com/in/swethankreddy

Currently:
${status.map((s) => `- ${s}`).join('\n')}

## Corpus
${catalogue}

Item ids are NOT listed here. Use searchPortfolio to find them.

## Writing
${writingIndex}
`.trim();
}
