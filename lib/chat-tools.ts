import { tool, type InferUITools, type UIDataTypes, type UIMessage } from 'ai';
import { z } from 'zod';
import { CHAT_LINKS, type ChatLinkKey } from './chat-links';
import { getItemDetail } from './item-details';

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
  // Returns full detail for one item by id — called before any substantive answer.
  getItemDetails: tool({
    description:
      'Fetch full detail for a specific project, research effort, or experience ' +
      'by its id. MUST be called before describing any specific item in depth. ' +
      'The system context only contains a short index — never answer from the ' +
      'index summary alone. Call this first, then use the returned detail.',
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
