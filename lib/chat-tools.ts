import { tool, type InferUITools, type UIDataTypes, type UIMessage } from 'ai';
import { z } from 'zod';
import { CHAT_LINKS, type ChatLinkKey } from './chat-links';
import { getItemDetail } from './item-details';
import { searchIndex } from './retrieval';

const LINK_KEYS = Object.keys(CHAT_LINKS) as [ChatLinkKey, ...ChatLinkKey[]];

const WORKSPACE_IDS = [
  'multi-agent',
  'cancer-omics',
  'market-regime',
  'aum-ventures',
  'object-detection',
  'gesture-recognition',
  'bulldozer-price',
  'swethankos',
] as const;

export const chatTools = {
  // Deterministic retrieval. Runs the lexical ranker over the compact index and
  // returns RANKED CANDIDATES — plural. The model no longer searches the index
  // itself; it asks this tool what is relevant, then fetches detail for each hit.
  searchPortfolio: tool({
    description:
      "Search Swethank's portfolio for items relevant to a question. ALWAYS call " +
      'this FIRST, before getItemDetails, for any question about his work. Returns ' +
      'a ranked list of candidates with ids. For broad, plural, comparison or ' +
      'timeline questions it returns SEVERAL candidates — you must then call ' +
      'getItemDetails for EACH candidate returned, not just the first one. ' +
      'Optionally filter by year (e.g. 2024) or category.',
    inputSchema: z.object({
      query: z.string().describe("The visitor's question or the key terms from it"),
      year: z.number().optional().describe('Restrict to a single year, e.g. 2024'),
      category: z.string().optional().describe('e.g. computer-vision, machine-learning, ai-systems'),
    }),
    execute: async ({ query, year, category }) => {
      const result = searchIndex(query, { year, category });
      return {
        intent: result.intent,
        years: result.years,
        count: result.candidates.length,
        // Explicit instruction travels with the payload so the model cannot
        // stop after one item on a multi-entity question.
        instruction:
          result.candidates.length > 1
            ? `Call getItemDetails for ALL ${result.candidates.length} ids below before answering.`
            : 'Call getItemDetails for the id below before answering.',
        candidates: result.candidates,
      };
    },
  }),

  // Returns full detail for one item by id — called before any substantive answer.
  getItemDetails: tool({
    description:
      'Fetch full detail for a specific item by id, using ids returned by ' +
      'searchPortfolio. MUST be called before describing any item in depth. ' +
      'When searchPortfolio returns several candidates, call this once per ' +
      'candidate — do not stop after the first.',
    inputSchema: z.object({
      id: z.enum(WORKSPACE_IDS).describe('Workspace card id'),
    }),
    execute: async ({ id }) => getItemDetail(id),
  }),

  // Surfaces a context card in the workspace UI. execute returns null — the
  // null result completes the tool-call round-trip so Gemini proceeds to text.
  showReference: tool({
    description:
      'Call this whenever you mention a specific project, research effort, or ' +
      "experience from Swethank's portfolio. The frontend will highlight the " +
      'matching context card so the visitor can click for details. Pass the id ' +
      'that matches the workspace card.',
    inputSchema: z.object({
      id: z.enum(WORKSPACE_IDS).describe('Workspace card id'),
      type: z.enum(['project', 'research', 'experience']),
      title: z.string().describe('Human-readable title of the item'),
    }),
    execute: async () => null,
  }),

  // Renders a clickable link chip. execute returns null for the same reason.
  showLink: tool({
    description:
      'Display a clickable link button when the visitor asks for a social ' +
      'profile, contact, or resume. Use a key from the allowed set.',
    inputSchema: z.object({
      target: z.enum(LINK_KEYS),
    }),
    execute: async () => null,
  }),
};

export type ChatMessage = UIMessage<unknown, UIDataTypes, InferUITools<typeof chatTools>>;
