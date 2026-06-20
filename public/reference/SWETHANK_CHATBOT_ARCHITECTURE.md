# Swethank Chatbot — Complete Architecture Handbook

> **Your definitive reference for understanding, debugging, extending, and rebuilding this chatbot from scratch.**
> Written as of June 2026. Reflects the actual production codebase.

---

## ⚠️ One Critical Fact First

The chatbot model is **Google Gemini 2.5 Flash** — not Claude. The Vercel AI SDK abstracts the provider behind a unified interface, which means you can swap to Claude, GPT-4, or any other model by changing one import. But the running production model is Gemini. Any interview answer about "the Claude integration" is wrong — the right answer is Gemini via the AI SDK's Google provider.

---

## Part 1 — Executive Summary

### What the chatbot does

A visitor to `swethank.xyz` arrives at a portfolio homepage. They click a button (labeled "Ask anything" or similar). The page transitions into a full-screen workspace layout: a column of workspace cards on the left, a chat interface in the center, and a detail panel on the right.

The visitor types a question — "tell me about the cancer research" or "can I see your GitHub?" — and the chatbot responds in streaming text, optionally highlighting the relevant workspace card and surfacing a clickable link chip.

The chatbot knows about Swethank's projects, research, experience, and contact details. It knows nothing else and refuses off-topic questions.

### Why this architecture was chosen

Three constraints shaped every decision:

1. **No infrastructure**: no database, no vector store, no embedding pipeline. Everything comes from `data/*.json` files on disk.
2. **Portfolio-scale context**: Swethank has ~8 items (projects, research, experience). That is too small to need RAG. A hand-written index + on-demand detail fetch is faster, cheaper, and easier to control.
3. **Interactive reference cards**: The chatbot must be able to say "I'm talking about *this* card" and highlight it in the UI. That requires a tool-call mechanism, not just text generation.

The result is a **stateless, streaming, tool-augmented chatbot** with a two-layer context system and three tools.

### Major technologies

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 16 App Router | Unified server + client in one repo |
| AI abstraction | Vercel AI SDK v6 (`ai`) | Streaming + tool support out of the box |
| AI provider | `@ai-sdk/google` (Gemini 2.5 Flash) | Fast, cheap, strong tool-calling |
| React hooks | `@ai-sdk/react` (`useChat`) | Manages message state, streaming, status |
| Transport | `DefaultChatTransport` from `ai` | Handles POST + SSE under the hood |
| Schema validation | Zod v4 | Tool input schemas; compile-time type safety |
| Rate limiting | Upstash Redis (optional) | Per-IP daily cap without a database |
| Markdown rendering | `react-markdown` v10 | Render AI responses with inline formatting |
| Animation | Framer Motion 12 | Smooth transitions for all UI state changes |

### High-level request flow (one sentence per step)

1. User types a message and presses Enter.
2. `sendMessage()` from `useChat` posts the message array to `/api/chat`.
3. The API route validates, rate-limits, truncates history, builds the system prompt, and calls `streamText`.
4. Gemini returns a streaming response — optionally calling tools mid-stream.
5. The AI SDK serializes the stream as Server-Sent Events (SSE) and returns it.
6. `useChat` on the client reads the SSE stream and updates the `messages` state progressively.
7. React re-renders each new token as it arrives.
8. A `useEffect` in `ChatSection` scans the latest assistant message for `showReference` tool calls and fires `onReferencedIdsChange`.
9. `ConversationLayout` receives the new referenced IDs and passes them to `ContextPanel`.
10. `ContextCard` renders a glowing ring on the highlighted card.

---

## Part 2 — Complete System Architecture

### The three-column workspace layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Nav bar (persists across portfolio ↔ conversation mode transitions)     │
├────────────────────┬─────────────────────────────┬──────────────────────┤
│  ContextPanel      │  ChatSection (workspace mode) │  CardDetail / empty  │
│  lg:w-[256px]      │  flex-1, min-w-0              │  lg:w-[272px]        │
│                    │                               │                      │
│  [Workspace cards] │  [Prompt: "Ask about..."]    │  [Selected card      │
│  ContextCard ×8    │                               │   detail view]       │
│                    │  [User: tell me about...  ]  │                      │
│  card referenced ─►│  [AI: Swethank built...   ]  │  Title               │
│  (glowing ring)    │  [streaming cursor ▌       ]  │  Description         │
│                    │                               │  Tags                │
│                    │  ┌─────────────────────────┐ │                      │
│                    │  │  Input + send button     │ │                      │
│                    │  └─────────────────────────┘ │                      │
└────────────────────┴─────────────────────────────┴──────────────────────┘
```

### Full request/response cycle

```
USER TYPES MESSAGE
       │
       ▼
ChatSection.handleSend()
  setInput('')
  sendMessage({ text })
       │
       ▼
useChat (DefaultChatTransport)
  Appends user message to messages[]
  POST /api/chat  { messages: UIMessage[] }
       │
       ▼
app/api/chat/route.ts  POST handler
  1. req.json()  →  extract messages[]
  2. Rate limit check (Upstash, optional)
  3. Input length guard (>500 chars → 400)
  4. History truncation at UIMessage boundaries
  5. convertToModelMessages()  →  ModelMessage[]
  6. getChatContext()  →  system prompt string
  7. streamText({ model, system, messages, tools })
       │
       ▼
@ai-sdk/google  →  Gemini 2.5 Flash API
  Gemini reads system prompt + message history
  Gemini decides: call getItemDetails first
       │
       ▼
Tool call: getItemDetails({ id: 'cancer-omics' })
  AI SDK intercepts, calls execute()
  execute() → getItemDetail('cancer-omics')
           → reads projects.json
           → formats markdown string
           → returns ~500 token detail
       │
       ▼
Gemini receives tool result, continues
Tool call: showReference({ id, type, title })
  execute() → returns null
  (Side effect is purely on the client)
       │
       ▼
Gemini generates text response (streaming)
  "Swethank's cancer omics research at IIT Bombay..."
  Each token arrives as a chunk
       │
       ▼
streamText → result.toUIMessageStreamResponse()
  Serializes stream as SSE (text/event-stream)
  Each SSE event: { type, value }
       │  (HTTP response stays open)
       ▼
DefaultChatTransport reads SSE stream
useChat processes each chunk:
  - Accumulates text parts
  - Records tool call parts (showReference, etc.)
  - Updates messages[] state on each chunk
       │
       ▼
React re-renders ChatSection
  Each new token: Markdown re-renders
  Cursor blink appears on last text part
       │
       ▼
useEffect detects showReference in latest assistant message
  Fires onReferencedIdsChange(['cancer-omics'])
       │
       ▼
ConversationLayout.setReferencedIds(['cancer-omics'])
  Passes referencedIds to ContextPanel
       │
       ▼
ContextPanel passes referenced={true} to ContextCard for 'cancer-omics'
  AnimatePresence shows glowing ring
  Card scrolls into view
       │
       ▼
COMPLETE — visitor sees streaming response + highlighted card
```

---

## Part 3 — Frontend Deep Dive

### `app/page.tsx` — Server Entry Point

**Purpose**: The only server component in the chatbot data flow. Reads data from disk and passes it down.

**Responsibilities**:
- Calls `getWorkspaceCards()` which reads `data/projects.json` and assembles `WorkspaceCard[]`
- Reads `currentStatus`, `recentWork`, `latestWriting` from disk
- Passes `workspaceCards` as props into `PortfolioPage`

**Why it exists**: Next.js App Router server components are where you do data fetching. The `fs`-based data access in `lib/data.ts` only works server-side. This component fetches once at request time; workspace cards are static for the life of the deployment.

**Key insight**: `workspaceCards` flows from here as a prop all the way to `ContextPanel` without any API call. The workspace cards you see on the left are not fetched by the client — they're serialized JSON passed from the server render.

```
app/page.tsx (server)
  getWorkspaceCards()  →  WorkspaceCard[]
       │ props
       ▼
PortfolioPage (client)
       │ props
       ▼
ConversationLayout (client)
       │ props
       ▼
ContextPanel (client)  →  renders ContextCard for each
```

---

### `components/PortfolioPage.tsx` — Mode State Owner

**Purpose**: The single client component that owns the `mode` state: `'portfolio' | 'conversation'`.

**Responsibilities**:
- `useState<Mode>('portfolio')` — controls which view is shown
- When user clicks the chat button in Hero, `handleChatOpen` sets mode to `'conversation'`
- `AnimatePresence` switches between `Hero` (portfolio mode) and `ConversationLayout` (conversation mode)
- Passes `workspaceCards` through to `ConversationLayout`

**Why it exists**: The mode toggle needs to be a client component (state). But the parent `app/page.tsx` must remain a server component to do disk reads. `PortfolioPage` is the boundary.

**Key design**: Nav is rendered *outside* the `AnimatePresence` block — it persists unchanged across mode transitions. Only the content below Nav transitions.

---

### `components/ConversationLayout.tsx` — Chat Workspace Orchestrator

**Purpose**: Owns and coordinates all three columns of the conversation workspace.

**Responsibilities**:
- Owns `selectedId: string | null` — which workspace card is clicked/selected
- Owns `referencedIds: string[]` — which cards the AI just mentioned (from `showReference` tool calls)
- Renders `ContextPanel` (left), `ChatSection` (center), `CardDetail` or empty placeholder (right)
- Provides `onReferencedIdsChange` callback to `ChatSection` — the bridge from AI tool calls to UI state

**Inputs**: `workspaceCards: WorkspaceCard[]` (from server)

**The key bridge** — this is how AI tool calls affect the UI:
```
ChatSection
  useEffect detects showReference in messages
  calls onReferencedIdsChange(['cancer-omics'])
         │
         ▼
ConversationLayout.setReferencedIds(['cancer-omics'])
         │
         ▼
ContextPanel receives referencedIds={['cancer-omics']}
         │
         ▼
ContextCard for 'cancer-omics' receives referenced={true}
  shows glowing ring
```

**Why `selectedId` and `referencedIds` are separate**: A user might click a card (selectedId) independently of what the AI is currently discussing (referencedIds). Both states coexist. A card can be referenced-but-not-selected (glowing ring, no detail panel) or selected-but-not-referenced (detail panel open, no ring).

---

### `components/ChatSection.tsx` — The Heart

**Purpose**: Everything the user sees and interacts with in the chat. Message display, input, streaming, tool call reading.

**Responsibilities**:
- Calls `useChat<ChatMessage>` with `DefaultChatTransport`
- Manages `input` state (controlled textarea)
- Manages `errorMsg` state (rate limit / network errors)
- Renders message transcript (user bubbles, AI responses with Markdown)
- Renders tool UI: `showLink` produces a link chip; `showReference` is silent
- Detects `showReference` tool calls in message parts and calls `onReferencedIdsChange`
- Auto-scrolls to bottom on new content
- Auto-focuses input in workspace mode

**Two render modes**:
- `mode='workspace'` (default for the conversation layout): fills container height, pinned input at bottom, overflow scrolls internally
- `mode='page'` (used on the home page's below-fold section): scrolls with the page, input is inline

**The type-safe message structure**:
```typescript
type ChatMessage = UIMessage<unknown, UIDataTypes, InferUITools<typeof chatTools>>
```

`InferUITools<typeof chatTools>` generates a discriminated union of all tool part types. This means:
- `part.type === 'tool-getItemDetails'` → TypeScript knows `part.input.id` is one of the valid workspace IDs
- `part.type === 'tool-showReference'` → TypeScript knows `part.input.id`, `part.input.type`, `part.input.title`
- `part.type === 'tool-showLink'` → TypeScript knows `part.input.target` is a valid `ChatLinkKey`

**showReference detection** (the most important useEffect in the file):
```typescript
useEffect(() => {
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
  // ...
  for (const part of lastAssistant.parts ?? []) {
    if (
      part.type === 'tool-showReference' &&
      (part.state === 'input-available' || part.state === 'output-available')
    ) {
      ids.push(part.input.id);
    }
  }
  onReferencedIdsChange?.(ids);
}, [messages, onReferencedIdsChange]);
```

Why `input-available` AND `output-available`? Because while the stream is active, the tool call might be in `input-available` state (the AI has decided to call the tool but the server hasn't returned the result yet). The UI should highlight the card immediately — not wait for the null result.

**Why `[...messages].reverse().find()`?** Only the *last* assistant message's references matter. If the AI mentioned project A in turn 1 and project B in turn 2, only project B should be highlighted. Reversing and finding the first assistant message is O(n) but the message list is never long (capped at 3 turns).

**Status values** from `useChat`:
- `'idle'` — no active request
- `'submitted'` — request sent, waiting for first token (shows thinking dots)
- `'streaming'` — tokens arriving (shows streaming cursor)
- `'error'` — request failed

**Why `mdComponents` is module-level (outside component)**:
If `mdComponents` were defined inside the component, a new object reference would be created on every render. `react-markdown` would detect a new `components` prop and re-mount the entire DOM tree on every streaming token — causing visible flicker. Module-level = one stable reference forever.

---

### `lib/chat-tools.ts` — Tool Definitions

**Purpose**: Defines the three tools available to the AI model, their input schemas, and their execute functions.

**The three tools**:

#### `getItemDetails`
- **Input**: `{ id: WORKSPACE_ID }` — one of 8 valid IDs
- **Execute**: Calls `getItemDetail(id)` → reads `projects.json` → formats a markdown detail string (~400-600 tokens)
- **Result**: The full project/experience detail is returned to the model as a tool result message
- **Effect**: The AI reads this and uses it as the basis for its text response. Without this, the model would answer from the short index (~10 tokens per item) which lacks metrics, stack detail, and narrative.

#### `showReference`
- **Input**: `{ id, type, title }`
- **Execute**: Returns `null`
- **Effect**: Purely frontend. The tool call appears in the UIMessage parts. `ChatSection`'s `useEffect` reads `part.input.id` and surfaces it to `ConversationLayout`. The model never uses the `null` result; the null just closes the tool-call step so the AI can continue generating text.

Why return `null` instead of something useful? The effect is in the UI, not in the AI's reasoning chain. The model calls `showReference` to *declare* "I'm talking about this item," not to get information. Returning null is the minimal correct implementation.

#### `showLink`
- **Input**: `{ target: ChatLinkKey }`
- **Execute**: Returns `null`
- **Effect**: In `ChatSection`, when rendering `part.type === 'tool-showLink'` and `part.state === 'input-available'`, the code renders a styled `<a>` tag with the URL from `CHAT_LINKS[part.input.target]`. The link chip appears inline in the message flow.

**The `ChatMessage` type export**:
```typescript
export type ChatMessage = UIMessage<unknown, UIDataTypes, InferUITools<typeof chatTools>>;
```

This type is consumed by `useChat<ChatMessage>` in `ChatSection.tsx`. Without the generic, `part.type` would be `string` and you'd need manual type guards everywhere. With it, TypeScript narrows each part to its exact shape.

---

### `components/ContextPanel.tsx` — Workspace Card Column

**Purpose**: Renders the left column of scrollable workspace cards. Staggered animation on mount. Passes through `selected` and `referenced` state to each card.

**Inputs**:
- `cards: WorkspaceCard[]`
- `selectedId: string | null`
- `onSelect: (id: string) => void`
- `referencedIds: string[]`

**Key behavior**: `referencedIds.includes(card.id)` is evaluated per card to set `referenced={true}`. This is the only connection between the AI's tool calls and each card's visual state.

**Animation**: `staggerChildren: 0.07` on the container `variants` means each card fades+slides in 70ms after the previous one — visible as a waterfall on first page load.

---

### `components/ContextCard.tsx` — Individual Workspace Card

**Purpose**: A button-like card showing one project/experience summary. Shows a glowing ring when the AI references it. Scrolls into view when first referenced. Shows GitHub icon on hover.

**The `referenced` ring**:
```tsx
<AnimatePresence>
  {referenced && !selected && (
    <motion.span
      className="pointer-events-none absolute inset-0 rounded-[18px]"
      style={{ boxShadow: '0 0 0 1.5px rgba(0,0,0,0.18) inset' }}
      initial={{ opacity: 0, scale: 0.93 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
    />
  )}
</AnimatePresence>
```

The ring is an absolutely-positioned `<span>` with an `inset` box-shadow. It's not a border (borders change layout); it's a non-layout `box-shadow`. The `AnimatePresence` handles the fade-in/out animation when `referenced` changes.

**Scroll into view on reference**: A `useEffect` watches `referenced`. When it transitions false → true, it calls `cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })`. The `wasReferenced` ref prevents re-scrolling on every render when referenced stays true.

---

### `components/CardDetail.tsx` — Right Column Detail Panel

**Purpose**: Shows the full `WorkspaceCard` details (description, tags, status, year) when a card is clicked. Not the same as `ProjectDetailPanel` — this is the in-chat workspace detail, not the `/projects` page detail.

**Inputs**: `card: WorkspaceCard` (the clicked card's data), `onClose: () => void`

**Content**: Thumbnail placeholder, label, title, status·year, description text, tag chips. No markdown rendering — this content comes from `WorkspaceCard.description` which is plain text.

**Escape key**: `useEffect` adds a keydown listener for `'Escape'` → calls `onClose`. Same pattern as `ProjectDetailPanel`.

---

### `lib/chat-context.ts` — System Prompt Context Builder

**Purpose**: Generates the context string injected into the system prompt on every request. This is the "index" — a short, structured catalog of all items.

**What it produces** (~600 tokens):
```
# Swethank Reddy
Bio: IIT Bombay undergrad...

## Item index (call getItemDetails before describing any item in depth)
id | category | title | tags
multi-agent | project | Multi-Agent AI Systems | PyTorch, LangGraph, ...
cancer-omics | research | Cancer Omics Research | genomics, ML, ...
...

## Writing
- "Article Title" (2025-06-01)
```

**Why it reads `getPublishedWriting()` and `getCurrentStatus()`** but NOT project details: Writing and current status are small (a few hundred characters). Project details are large (~400-600 tokens each × 8 = ~4000 tokens). Injecting all details would use 4000 tokens per request just for context that may never be needed. The on-demand `getItemDetails` tool call fetches detail only when the visitor actually asks about a specific item.

**Why it's a function, not a module-level constant**: The underlying data (`data/writing.json`, `data/current.json`) can change between requests (via the admin panel). Building it fresh per request ensures the AI always sees current writing and status.

---

## Part 4 — Backend Deep Dive

### `app/api/chat/route.ts` — The API Route

This is a Next.js App Router Route Handler. It receives POST requests, calls Gemini, and returns a streaming response.

**Full function walkthrough**:

#### Step 1: Input parsing
```typescript
const body = await req.json();
messages = body.messages;
if (!Array.isArray(messages)) throw new Error('bad shape');
```
The `try/catch` returns a 400 if the body isn't valid JSON or if `messages` isn't an array. No schema validation beyond shape — Zod validates tool inputs separately.

#### Step 2: Rate limiting (optional)
```typescript
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  // Upstash Ratelimit: fixedWindow, DAILY_LIMIT per IP per day
}
```
Rate limiting is guarded by env var existence — if Upstash isn't configured, this block is entirely skipped. In development, the limit is 60/day. In production, 10/day.

IP extraction priority: `cf-connecting-ip` (Cloudflare) → `x-forwarded-for` (generic proxy) → `x-real-ip` (nginx) → `'unknown'`. The `cf-connecting-ip` header is Cloudflare's reliable single-IP header (unlike `x-forwarded-for` which can be spoofed or list multiple IPs).

#### Step 3: Input length guard
```typescript
if (lastText.length > 500) {
  return Response.json({ error: 'Message too long...' }, { status: 400 });
}
```
Extracts text from the last message (handling both `string` content and `parts[]` format) and rejects if over 500 characters. This prevents prompt injection attacks via very long inputs and controls token usage.

#### Step 4: History truncation — the subtle critical piece

This is the most important part of the backend. Read it carefully.

```typescript
const MAX_TURNS = 3;
const userMsgIndices = messages.reduce<number[]>(
  (acc, m, i) => (m.role === 'user' ? [...acc, i] : acc), []
);
const sliceFrom = userMsgIndices.length > MAX_TURNS
  ? userMsgIndices[userMsgIndices.length - MAX_TURNS]
  : 0;
const slicedUIMessages = messages.slice(sliceFrom);
```

**Why this matters**: Each `UIMessage` (what `useChat` manages) can contain multiple tool calls and results embedded as `parts`. When you call `convertToModelMessages()`, ONE UIMessage can expand into 3-6 `ModelMessage` objects (user text → tool call → tool result → text).

If you naively slice the *model message* array (e.g., `modelMessages.slice(-10)`), you might cut mid-expansion — keeping a tool call but losing its result. Gemini then receives an assistant message with a tool call and no corresponding result, which is an invalid conversation state.

The fix: slice at **UIMessage boundaries** before calling `convertToModelMessages`. Find the indices of user messages (they mark the start of each turn), count back `MAX_TURNS` from the end, and slice from there.

```
UIMessages before slicing:
[user₁][ai₁+tools₁][user₂][ai₂+tools₂][user₃][ai₃+tools₃]

After slicing (MAX_TURNS=3, keep last 3 user messages):
[user₁][ai₁+tools₁][user₂][ai₂+tools₂][user₃][ai₃+tools₃]

After convertToModelMessages:
[user₁_model][ai₁_model][tool_call₁][tool_result₁][ai₁_text][user₂_model]...
   ↑ always starts with a user message ↑
```

#### Step 5: `convertToModelMessages()`
```typescript
const limitedMessages = await convertToModelMessages(
  slicedUIMessages,
  { tools: chatTools, ignoreIncompleteToolCalls: true },
);
```

Expands `UIMessage[]` (the React-state format) into `ModelMessage[]` (the format the AI provider expects). `ignoreIncompleteToolCalls: true` silently drops any tool calls that have no matching result (a safety valve for edge cases).

#### Step 6: System prompt construction
```typescript
const context = getChatContext();
const systemPrompt = `You are the AI assistant on Swethank Reddy's portfolio...
<context>${context}</context>`;
```

The system prompt has two parts:
1. **Behavioral instructions** (~400 tokens): Persona, mandatory tool call order, response format, how to handle skepticism.
2. **Context block** (~600 tokens): The item index, bio, current status, writing list.

Total system prompt: ~1000 tokens per request. This is static in the sense that it doesn't grow with conversation length.

#### Step 7: `streamText()`
```typescript
const result = streamText({
  model: google('gemini-2.5-flash'),
  system: systemPrompt,
  messages: limitedMessages,
  tools: chatTools,
  stopWhen: stepCountIs(6),
  experimental_transform: smoothStream(),
  maxOutputTokens: 600,
  onError: ...,
});
```

Key parameters:
- `stopWhen: stepCountIs(6)` — The AI SDK counts "steps." Each tool call + result is one step. Text generation is one step. Worst case: 2 items × (getItemDetails + showReference) = 4 tool steps + 1 text step = 5 steps. Limit of 6 prevents infinite loops while giving headroom.
- `experimental_transform: smoothStream()` — Smooths out token delivery. Gemini can emit tokens in bursts; `smoothStream()` adds a small buffer to deliver them at a more human-readable pace.
- `maxOutputTokens: 600` — The system prompt instructs "4-5 sentences max." 600 tokens enforces this at the API level regardless of model behavior.

#### Step 8: Return streaming response
```typescript
return result.toUIMessageStreamResponse();
```

Converts the `StreamText` result into an HTTP response with `Content-Type: text/event-stream`. The AI SDK formats each chunk as an SSE event that `DefaultChatTransport` can parse on the client.

---

## Part 5 — Vercel AI SDK Deep Dive

### What the AI SDK is

The Vercel AI SDK (`ai` package) is a TypeScript library that provides:
1. **Provider abstractions**: Swap between OpenAI, Anthropic, Google, Mistral, etc. with one import change
2. **Streaming primitives**: `streamText()` returns a result with multiple output formats (SSE, text, data stream)
3. **Tool call plumbing**: Validates inputs, calls `execute()`, feeds results back to the model automatically
4. **React integration** (`@ai-sdk/react`): `useChat` hook manages message state, handles streaming, exposes status

### Why it was chosen

Without the AI SDK, you'd need to:
- Implement the Gemini streaming protocol directly
- Handle tool call detection, execution, and result injection manually
- Build your own React state management for streaming messages
- Write SSE serialization/deserialization
- Handle provider-specific differences if you ever switch models

The AI SDK eliminates all of that. The cost: you're learning the SDK's abstractions instead of the raw APIs.

### How `useChat` works internally

```typescript
const { messages, sendMessage, status } = useChat<ChatMessage>({
  transport: new DefaultChatTransport({ api: '/api/chat' }),
  onError: ...,
  onFinish: ...,
});
```

**What `useChat` maintains**:
- `messages: UIMessage[]` — the full conversation history in the UI-friendly format
- `status: 'idle' | 'submitted' | 'streaming' | 'error'`
- Internally: an abort controller (to cancel in-flight requests), a buffer for streaming chunks

**What happens when `sendMessage({ text })` is called**:
1. Creates a new user `UIMessage` with a unique ID, appends it to `messages`
2. Sets `status = 'submitted'`
3. Calls `transport.send()` with the current `messages` array serialized to JSON

**What happens as the stream arrives**:
1. `DefaultChatTransport` opens an SSE connection (the POST response stays open)
2. Each SSE event is decoded and passed to `useChat`'s stream processor
3. The processor builds the assistant's `UIMessage` parts progressively:
   - Text tokens → append to the current `text` part
   - Tool call detected → create a `tool-[toolName]` part in `'input-available'` state
   - Tool result received → update that part to `'output-available'` state
4. `messages` state is updated on each chunk → React re-renders
5. When the stream closes, `status = 'idle'`, `onFinish` fires

### How `DefaultChatTransport` works

`DefaultChatTransport` is the default implementation of the AI SDK's transport interface. It:
1. Takes `{ api: '/api/chat' }` — the endpoint URL
2. On `send()`: performs `fetch('/api/chat', { method: 'POST', body: JSON.stringify({ messages }) })`
3. Reads the response as a `ReadableStream`
4. Processes SSE events from the stream line-by-line
5. Passes parsed events to `useChat`'s event processor

You could write a custom transport for WebSockets, for example, or to add auth headers. `DefaultChatTransport` is the correct choice for standard HTTP SSE.

### How `streamText` works internally

```
streamText({ model, system, messages, tools })
```

1. Converts the call into the provider-specific API format (`@ai-sdk/google` does this for Gemini)
2. Calls the Gemini API with streaming enabled
3. Returns a `StreamTextResult` object with multiple accessors:
   - `.textStream` — async iterable of text tokens
   - `.fullStream` — async iterable of all events (text, tool calls, metadata)
   - `.toUIMessageStreamResponse()` — HTTP Response with SSE body

**The agentic loop** (why `stepCountIs` exists):

When `tools` are provided, `streamText` runs an agentic loop:
```
Step 1: Model generates → tool call (getItemDetails)
        AI SDK calls execute() → returns detail string
Step 2: Model generates → tool call (showReference)
        AI SDK calls execute() → returns null
Step 3: Model generates → text response
        Stream ends
```

Each round-trip to the model is one "step." `stepCountIs(6)` stops the loop after 6 steps. Without this, a model could theoretically call tools indefinitely.

### UIMessage vs ModelMessage — the key distinction

**`UIMessage`** (what `useChat` maintains in React):
- One object per conversation turn
- Contains `role`, `id`, and `parts[]` (a flat array of all content in that turn)
- Parts can be: `{ type: 'text', text: '...' }`, `{ type: 'tool-getItemDetails', input: {...}, state: '...' }`, etc.
- Human-readable, React-renderable
- This is what gets serialized and sent to the server

**`ModelMessage`** (what the AI provider receives):
- Multiple objects per conversation turn (expansion of tool calls)
- Follows the AI provider's expected format
- A single `UIMessage` with 2 tool calls becomes 5+ `ModelMessage` objects
- This is what `convertToModelMessages()` produces

The SDK maintains `UIMessage` format on the client for simplicity. It converts to `ModelMessage` on the server right before the API call.

---

## Part 6 — AI Model Integration (Gemini 2.5 Flash)

### Model selection

```typescript
import { google } from '@ai-sdk/google';
const model = google('gemini-2.5-flash');
```

**Why Gemini 2.5 Flash** (not Claude, not GPT-4):
- **Cost**: Flash is significantly cheaper per token than GPT-4 or Claude Sonnet for a portfolio chatbot receiving low traffic
- **Tool calling**: Gemini 2.5 Flash has strong, reliable tool-calling behavior
- **Speed**: Flash prioritizes low latency — important for a streaming chat experience where perceived responsiveness matters
- **Context window**: More than sufficient for this use case

**The trade-off**: Gemini may occasionally be less "conversational" than Claude. For a factual Q&A chatbot about a portfolio, this is acceptable. If you ever want more natural conversation, switch to `anthropic('claude-sonnet-4-6')` — one line change.

### System prompt design

The system prompt has four sections:

**1. Role definition** (~20 tokens): "You are the AI assistant on Swethank Reddy's portfolio website."

**2. Mandatory tool ordering** (~100 tokens): The most critical behavioral instruction. It forces the model to call `getItemDetails` before answering any specific question. Without this instruction, Gemini might answer from the short index — giving vague, detail-free responses.

**3. Behavioral guidelines** (~250 tokens):
- Third person ("Swethank built...") — makes the AI feel like a representative, not Swethank himself
- Max 4-5 sentences — prevents essays
- How to handle skepticism — prevents defensive or robotic responses
- Tool call order: getItemDetails → showReference → text response

**4. Context block** (~600 tokens): The item index from `getChatContext()`.

**Total**: ~1000 tokens per request. This is efficient — the system prompt doesn't grow with conversation length.

### Request/response format

The AI SDK handles format conversion. What Gemini actually receives (simplified):

```json
{
  "model": "gemini-2.5-flash",
  "system_instruction": "You are the AI assistant...<context>...</context>",
  "contents": [
    { "role": "user", "parts": [{"text": "tell me about cancer research"}] },
    { "role": "model", "parts": [{"functionCall": {"name": "getItemDetails", "args": {"id": "cancer-omics"}}}] },
    { "role": "tool", "parts": [{"functionResponse": {"name": "getItemDetails", "response": {"content": "...detail..."}}}] },
    { "role": "model", "parts": [{"functionCall": {"name": "showReference", "args": {"id": "cancer-omics", "type": "research", "title": "Cancer Omics Research"}}}] },
    { "role": "tool", "parts": [{"functionResponse": {"name": "showReference", "response": null}}] }
  ],
  "tools": [{ "function_declarations": [...] }],
  "generation_config": { "max_output_tokens": 600 }
}
```

The AI SDK builds this format from your `ModelMessage[]` and `tools` definition.

---

## Part 7 — Streaming Architecture

### Server-Sent Events (SSE) from first principles

SSE is a protocol for servers to push data to clients over a persistent HTTP connection. Unlike WebSockets (bidirectional), SSE is unidirectional: server to client.

**The HTTP contract**:
- Client sends: `POST /api/chat` with messages body
- Server responds with headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`
- Connection stays open
- Server sends data as text lines: `data: <payload>\n\n`
- Client reads each `data:` line as an event
- When the server is done, it closes the connection

**Why SSE instead of WebSockets for this use case**:
- SSE works over standard HTTP — no protocol upgrade needed
- SSE is request-scoped — each message sends a new POST, gets a new SSE stream, which closes when done. Simple lifecycle.
- WebSockets maintain a persistent bidirectional connection — unnecessary complexity for a chatbot where each exchange is stateless

### How a streaming response flows

```
Gemini API (via @ai-sdk/google)
  Token₁ → Token₂ → Token₃ → [tool call] → [tool result] → Token₄ → ...
       │
       ▼
streamText fullStream (async iterable)
  { type: 'text-delta', textDelta: 'Swethank' }
  { type: 'text-delta', textDelta: "'s" }
  { type: 'tool-call', toolCallId: 'tc1', toolName: 'getItemDetails', input: {...} }
  { type: 'tool-result', toolCallId: 'tc1', result: '...detail...' }
  { type: 'text-delta', textDelta: 'research' }
  ...
       │
       ▼
result.toUIMessageStreamResponse()
  Serializes each event as SSE:
  data: {"type":"text-delta","textDelta":"Swethank"}
  data: {"type":"tool-call",...}
  data: [DONE]
       │  (HTTP response body, kept open)
       ▼
DefaultChatTransport (browser)
  Reads ReadableStream from fetch response
  Parses SSE line by line
  Dispatches parsed events to useChat processor
       │
       ▼
useChat message state update
  On text-delta: append text to current assistant message part
  On tool-call: create tool part in 'input-available' state
  On tool-result: update tool part to 'output-available' state
  On each update: React.setState() → re-render
       │
       ▼
React re-renders ChatSection
  Markdown re-renders with new text
  Streaming cursor blink appears on last text part
```

### `smoothStream()` — why it exists

Gemini sometimes emits tokens in bursts: 10 tokens at once, then silence for 200ms, then 15 tokens. Without smoothing, the UI would update in jerky bursts instead of a continuous stream.

`smoothStream()` is an `experimental_transform` in the AI SDK. It wraps the fullStream and releases tokens at a controlled rate — like a buffer drain. The result appears as a steady character-by-character output even when the underlying API delivers chunks.

### Why React doesn't thrash during streaming

React batches state updates in event handlers. During streaming, each SSE event triggers a `setState()`. In React 18+, these are automatically batched — multiple `setState` calls within the same event loop tick are merged into one render. This prevents 30+ renders per second during fast streaming.

`AnimatePresence` and Framer Motion are carefully used with `initial={false}` on some containers to prevent re-mounting existing elements during streaming.

---

## Part 8 — Reference System Deep Dive

### The problem the reference system solves

When the AI says "Swethank's cancer research at IIT Bombay is interesting," how does the workspace card for "Cancer Omics Research" know to highlight itself? The AI's text response is just a string — it can't directly call React functions.

The solution: a **UI-effect tool**. The AI calls `showReference()` as a signal to the frontend. The tool's `execute()` returns `null` (no data needed), but the tool call itself is preserved in the `UIMessage`'s parts array, where the frontend can read it.

### The complete reference flow

```
1. AI DECISION
   Gemini determines it's discussing 'cancer-omics'.
   Tool call: showReference({ id: 'cancer-omics', type: 'research', title: 'Cancer Omics Research' })
   
2. AI SDK EXECUTION
   AI SDK calls execute() → returns null
   Tool result message: { name: 'showReference', result: null }
   This null result is sent back to Gemini so the step completes.

3. SERIALIZATION
   toUIMessageStreamResponse() emits SSE events:
   { type: 'tool-call', toolName: 'showReference', input: { id: 'cancer-omics', ... } }
   { type: 'tool-result', toolCallId: '...', result: null }

4. CLIENT DESERIALIZATION
   DefaultChatTransport receives SSE events.
   useChat creates a part in the assistant UIMessage:
   {
     type: 'tool-showReference',
     state: 'input-available',  ← after tool call received
     input: { id: 'cancer-omics', type: 'research', title: '...' }
   }
   Later: state transitions to 'output-available' when result arrives.

5. EFFECT DETECTION (ChatSection.tsx, useEffect)
   The useEffect runs whenever messages[] changes.
   It scans the last assistant message's parts[]:
   for (const part of lastAssistant.parts ?? []) {
     if (part.type === 'tool-showReference' && 
         (part.state === 'input-available' || part.state === 'output-available')) {
       ids.push(part.input.id);  // 'cancer-omics'
     }
   }
   Calls onReferencedIdsChange(['cancer-omics'])

6. STATE UPDATE (ConversationLayout.tsx)
   setReferencedIds(['cancer-omics'])
   Re-renders ContextPanel with referencedIds={['cancer-omics']}

7. CARD HIGHLIGHT (ContextPanel → ContextCard)
   ContextCard receives referenced={true}
   AnimatePresence shows the glowing ring span
   cardRef.scrollIntoView() brings the card into view

8. CLEAR ON NEXT TURN
   When the next AI response arrives, the useEffect re-runs.
   If the new assistant message has no showReference calls,
   onReferencedIdsChange([]) fires → referencedIds = []
   → the ring fades out
```

### Why cards clear between turns

The `useEffect` only looks at the **last** assistant message. When the visitor asks a new question, the new AI response replaces the "last assistant" — and if it references different items, the ring moves. If it references nothing, `onReferencedIdsChange([])` clears all highlights. This prevents stale highlights from a previous conversation turn persisting visually.

---

## Part 9 — Data Flow Maps

### Map 1: Message Flow (simplified)

```
[User types]
     │
     ▼
ChatSection.input (useState)
     │ sendMessage({ text })
     ▼
useChat
  messages = [...prev, { role: 'user', parts: [{ type: 'text', text }] }]
     │ POST /api/chat
     ▼
API Route
  UIMessages → ModelMessages
  → streamText → Gemini
     │ SSE stream
     ▼
useChat
  messages = [...prev, userMsg, { role: 'assistant', parts: [text, toolCalls...] }]
     │ setState (batched)
     ▼
ChatSection re-renders transcript
```

### Map 2: Streaming Flow (detailed)

```
Gemini API ──── chunk₁ (text) ──────────────────────────────┐
            ──── chunk₂ (tool-call: getItemDetails) ──────┐  │
            ──── chunk₃ (tool-result: detail string) ──┐   │  │
            ──── chunk₄ (tool-call: showReference) ─┐  │   │  │
            ──── chunk₅ (tool-result: null) ──────┐  │  │   │  │
            ──── chunk₆ (text: "Swethank...") ─┐  │  │  │   │  │
                                                │  │  │  │   │  │
AI SDK fullStream processes each in order ──────┘──┘──┘──┘───┘──┘
     │
     ▼
toUIMessageStreamResponse()
  Serializes as SSE: data: {...}\n\n for each chunk
     │ HTTP body (kept open)
     ▼
DefaultChatTransport
  ReadableStream reader, line-by-line
  Parse JSON from "data: {...}" lines
     │
     ▼
useChat event processor
  Builds assistant UIMessage parts[]
  Calls React.setState on each event
     │
     ▼
React renders ChatSection progressively
  Text appears token by token
  Cursor blinks at end
  Tool parts stored but not visually rendered (showReference)
  Link chips rendered when showLink input-available
```

### Map 3: Reference Card Activation Flow

```
Gemini calls showReference({ id: 'cancer-omics', ... })
     │
     ▼ (SSE event)
useChat: assistant message parts gets
  { type: 'tool-showReference', state: 'input-available', input: { id: 'cancer-omics' } }
     │ (messages state updates)
     ▼
ChatSection useEffect fires
  scans lastAssistant.parts for tool-showReference parts
  collects ids: ['cancer-omics']
  calls onReferencedIdsChange(['cancer-omics'])
     │ (callback prop)
     ▼
ConversationLayout.setReferencedIds(['cancer-omics'])
     │ (prop drilling)
     ▼
ContextPanel receives referencedIds={['cancer-omics']}
  maps cards, passes referenced={referencedIds.includes(card.id)}
     │ (per-card prop)
     ▼
ContextCard 'cancer-omics' receives referenced={true}
  AnimatePresence: shows glowing ring (opacity 0→1, scale 0.93→1)
  useEffect: cardRef.scrollIntoView({ behavior: 'smooth' })
```

### Map 4: Project Context Flow (data, not API)

```
data/projects.json  (disk)
     │ fs.readFileSync (server only)
     ▼
getWorkspaceCards() in lib/data.ts
  Filters to published projects with workspaceId
  Maps to WorkspaceCard[] shape
  Appends WORKSPACE_EXPERIENCE_ITEMS (aum-ventures)
     │ (server-side, at request time)
     ▼
app/page.tsx (server component)
  const workspaceCards = getWorkspaceCards()
     │ (props, serialized JSON)
     ▼
PortfolioPage → ConversationLayout → ContextPanel → ContextCard
  (zero API calls — all data from initial server render)

SEPARATELY, for chatbot detail:
     │ (at chat request time)
     ▼
API Route: getItemDetail(id)
  getProjects() → reads projects.json again
  finds project by workspaceId
  formats detail string
  returns ~500 tokens
     │ (tool result, injected into model context)
     ▼
Gemini uses detail to generate response
```

---

## Part 10 — Architecture Decision Log

### Decision 1: Two-layer context (index + on-demand detail)

**What**: System prompt has a short index (~10 tokens/item). Full detail fetched via `getItemDetails` tool only when needed.

**Why**: 8 items × 500 tokens/item = 4000 tokens if injected wholesale. Most questions only need 1-2 items. On-demand fetching reduces average request cost by ~75%.

**Alternative**: Full RAG with vector embeddings. Overkill for 8 static items. Requires a vector database, embedding pipeline, similarity search. The marginal quality improvement over a structured index + tool call doesn't justify the infrastructure.

**Trade-off**: One extra round-trip to the model (tool call → tool result → response). Adds ~500ms to TTFT (time to first text token). Acceptable for a portfolio chatbot; unacceptable for a real-time assistant.

### Decision 2: `showReference` as a UI-effect tool returning null

**What**: `showReference` executes on the server, returns null. Its only purpose is to leave a trace in the UIMessage parts that the frontend reads.

**Why**: The AI cannot directly call React functions. Tools are the only mechanism for the AI to signal intent. A UI-effect tool (returns null, read by client) is the clean pattern for "AI declares which UI element to highlight."

**Alternative**: Parse the AI's text response for item IDs using regex. Fragile — depends on the model consistently formatting item mentions. Tool calls are structured, validated by Zod, and reliable.

**Alternative 2**: Return the workspace card's data from `showReference` and let the client display it. Would make the tool do two things (signal AND data fetch). Separation of concerns: `getItemDetails` fetches data, `showReference` signals the UI.

### Decision 3: History truncation at UIMessage boundaries

**What**: Slice `messages[]` before `convertToModelMessages()`, always starting at a user message.

**Why**: Slicing model messages mid-expansion leaves orphaned tool calls (assistant message has tool call but no tool result). This is an invalid conversation state that causes Gemini to either hallucinate or produce unexpected output.

**Alternative**: Keep full history. As conversations grow long, costs increase linearly. A 20-turn conversation with 2 tool calls each = 80+ model messages. `MAX_TURNS = 3` keeps the context to ~6 turns maximum.

**Trade-off**: Context amnesia after 3 turns. The visitor can't reference something they said 4 messages ago. Acceptable for a portfolio chatbot (conversations are typically 3-5 exchanges total).

### Decision 4: Gemini 2.5 Flash over Claude or GPT-4

**What**: Using `@ai-sdk/google` with `gemini-2.5-flash`.

**Why**: Flash is ~5× cheaper than Claude Sonnet and ~3× cheaper than GPT-4o for this workload. The quality difference for factual Q&A about structured data is minimal. Strong tool-calling behavior.

**Trade-off**: Slightly less natural conversational tone than Claude. Less predictable behavior on edge cases (unusual questions, skepticism handling). Claude's training makes it more reliably human-sounding.

**How to switch**: One line: `google('gemini-2.5-flash')` → `anthropic('claude-sonnet-4-6')`. Install `@ai-sdk/anthropic`, add `ANTHROPIC_API_KEY`.

### Decision 5: `smoothStream()` transform

**What**: `experimental_transform: smoothStream()` wraps the token stream.

**Why**: Gemini delivers tokens in bursts. Without smoothing, text appears in chunks separated by visible pauses. `smoothStream()` creates an even drip that feels more like human typing.

**Trade-off**: Adds a small buffer delay before text starts appearing (~100ms). Net UX improvement despite the delay.

### Decision 6: No database for workspace cards

**What**: `WorkspaceCard[]` is derived from `data/projects.json` at server render time, passed as props.

**Why**: Eliminates the need for a database entirely. Workspace cards change rarely (only when the admin adds/edits a project). Consistency is guaranteed — the same JSON file powers both the projects page and the workspace panel.

**Trade-off**: Card data is stale for users who loaded the page before an admin update. Reloading the page refreshes it. For a portfolio, this is fine.

---

## Part 11 — Debugging Guide

### Problem: "Claude not responding" / chatbot shows no response

Despite the section title, the model is Gemini — but "not responding" applies either way.

**Root causes**:
1. `GOOGLE_GENERATIVE_AI_API_KEY` env var missing or invalid
2. Network error reaching the Gemini API
3. Rate limit hit (Upstash returns 429, which the frontend catches)
4. Message length >500 characters (API returns 400)

**Detection**:
```
Browser DevTools → Network tab → POST /api/chat
Check response status:
  400 → invalid request (body shape or message too long)
  429 → rate limit hit
  500 → server error (likely API key or Gemini error)
  200 with streaming → working
```

**Fix checklist**:
1. Check `.env.local` has `GOOGLE_GENERATIVE_AI_API_KEY=...`
2. Check the API key is valid at Google AI Studio
3. Check `NODE_ENV` — in dev, Upstash limits are 60/day; in production, 10/day
4. Add `console.log` in `onError` callback of `streamText` to see the exact error

### Problem: Streaming stops mid-response / incomplete answers

**Root cause 1**: `maxOutputTokens: 600` hit. The response was too long.
**Fix**: Increase `maxOutputTokens` or tune the system prompt to demand shorter responses.

**Root cause 2**: `stepCountIs(6)` triggered. Too many tool calls.
**Fix**: Increase `stepCountIs(N)`. Check if Gemini is calling tools unnecessarily.

**Root cause 3**: `smoothStream()` buffer issue.
**Fix**: Remove `experimental_transform: smoothStream()` temporarily to isolate.

### Problem: Tool call failures — "No detail found for that id"

**Root cause**: The `id` passed to `getItemDetails` doesn't match any project's `workspaceId` in `projects.json`.

**Detection**: Check the server console log. `getItemDetail('some-id')` returns `'No detail found for that id.'` → Gemini gets this as the tool result and reports it.

**Fix**: 
1. Verify the item exists in `projects.json` with the correct `workspaceId`
2. Verify the `WORKSPACE_IDS` array in `lib/chat-tools.ts` includes the ID
3. If adding a new project, add its `workspaceId` to both `projects.json` AND the `WORKSPACE_IDS` const array

**Why both places?** The `WORKSPACE_IDS` array is a Zod enum used to validate the tool input. If the ID isn't in the enum, Zod rejects the tool call before `execute()` is even called.

### Problem: Reference cards not appearing

**Root cause 1**: `showReference` tool is being called but `part.state` is not `'input-available'` or `'output-available'`.
**Detection**: Add `console.log(msg.parts)` in the `useEffect` in ChatSection.

**Root cause 2**: The `referencedIds` aren't flowing from ChatSection → ConversationLayout.
**Detection**: Check `onReferencedIdsChange` is passed from ConversationLayout → ChatSection.

**Root cause 3**: The card's `id` in `workspaceCards` doesn't match the `id` passed to `showReference`.
**Detection**: Log `referencedIds` in ConversationLayout; log `card.id` in ContextCard. They must match exactly.

### Problem: History causes Gemini to produce wrong/confused answers

**Root cause**: Likely an orphaned tool call — a tool call with no matching result — slipped through.

**Detection**: Enable dev logging (`process.env.NODE_ENV === 'development'` block in route.ts logs history slice info). Look for the log: `[chat/route] history: X ui msgs → kept Y`.

**Fix**: Verify `convertToModelMessages` with `ignoreIncompleteToolCalls: true` is set. This silently drops any tool calls lacking results. If still failing, increase `MAX_TURNS` (or reduce if the issue is too many tool call expansions overflowing context).

### Problem: Context panel not showing (workspace cards missing)

**Root cause**: `workspaceCards` prop not being passed through the component tree.

**Chain**: `app/page.tsx` → `PortfolioPage` → `ConversationLayout` → `ContextPanel`

**Detection**: Add `console.log(workspaceCards.length)` in ConversationLayout.

**Root cause 2**: Projects in `projects.json` don't have `workspaceId` field.
**Fix**: Add `workspaceId`, `workspaceLabel`, `workspaceTitle` fields to the project entry.

---

## Part 12 — Future Evolution

### How this architecture scales

The current architecture is a flat list of 8 items. Here's where and how each potential upgrade would slot in:

### RAG + Vector Search

**Where it fits**: Replace `getChatContext()` and `getItemDetail()`.

**Current flow**: Static index in system prompt → tool call fetches full detail from JSON.

**RAG flow**: User query → embed query → vector search against embedded project details → inject only relevant chunks into context.

**When to add it**: When the number of projects exceeds ~20-30, injecting the full index becomes expensive and retrieval quality from the AI's memory degrades.

**Implementation point**: `lib/chat-context.ts` becomes `lib/chat-context-dynamic.ts` using something like Pinecone, Weaviate, or pgvector. The `getItemDetails` tool can be replaced with a semantic search call.

### Persistent Memory / User Sessions

**Where it fits**: Between `useChat` and the API route.

**Current**: Every page load starts fresh. No memory of previous visits.

**With memory**: Store conversation history in a database keyed by session ID (cookie). On subsequent visits, inject past conversation summary into the system prompt.

**Implementation point**: Add a session cookie, a Redis or Postgres table for sessions, and inject `getSummary(sessionId)` into the system prompt.

### Project Retrieval at Admin Time

**Where it fits**: `getItemDetail()` in `lib/item-details.ts`.

**Current**: Reads from `projects.json` on disk.

**With database**: Replace file reads with a Prisma/database query. `getItemDetail(id)` becomes `db.project.findUnique({ where: { workspaceId: id } })`.

### Citation System

**Where it fits**: In `ChatSection.tsx`'s message renderer.

**Current**: AI response is rendered as Markdown. Sources aren't visually cited.

**With citations**: Define a `showCitation` tool (similar to `showReference`). The AI calls it with `{ quote, source, itemId }`. In `ChatSection`, render `tool-showCitation` parts as styled inline citations.

### Multi-Agent Architecture

**Where it fits**: Inside `app/api/chat/route.ts`, wrapping `streamText`.

**Current**: One model call per user message.

**Multi-agent**: A router agent receives the query, decides which specialist agent to invoke (project expert, research expert, career advisor), each specialist has a specialized system prompt and tool set.

**Implementation**: The AI SDK supports agent handoffs via `generateText` with `handoff` tool calls, or manual orchestration with multiple `streamText` calls.

---

## Part 13 — Build From Scratch

### Prerequisites

```
Node.js 20+
Next.js 16 App Router project
Environment variables:
  GOOGLE_GENERATIVE_AI_API_KEY=...
  (optional) UPSTASH_REDIS_REST_URL=...
  (optional) UPSTASH_REDIS_REST_TOKEN=...
```

### Dependencies to install

```bash
npm install ai @ai-sdk/react @ai-sdk/google zod react-markdown
npm install @upstash/ratelimit @upstash/redis  # optional, for rate limiting
```

### Step-by-step build order

#### File 1: `lib/chat-links.ts`

Start with the simplest file — pure data, no logic. This is the map of clickable link destinations the AI can surface.

```typescript
export const CHAT_LINKS = {
  github: { label: 'Open GitHub', url: 'https://github.com/yourusername' },
  linkedin: { label: 'Open LinkedIn', url: 'https://linkedin.com/in/yourusername' },
  email: { label: 'Email me', url: 'mailto:you@example.com' },
} as const;

export type ChatLinkKey = keyof typeof CHAT_LINKS;
```

**Why first**: No dependencies. Establishes the link vocabulary before tools need it.

---

#### File 2: `lib/chat-context.ts`

Define what the AI "knows" — the short index injected into every system prompt.

```typescript
export function getChatContext(): string {
  return `
# Your Name

Bio: One sentence bio here.

## Item index (call getItemDetails before describing any item)
id | category | title | tags
project-1 | project | My First Project | TypeScript, React
project-2 | research | My Research | ML, Python
`.trim();
}
```

**Why second**: The API route depends on this. Get the context shape right before wiring the API.

**Common mistake**: Putting full project descriptions here. Keep it to ~10 tokens per item — titles, categories, tags only.

---

#### File 3: Data files for project details

Create `data/projects.json` with your projects. Include a `workspaceId` field on each. This is the source of truth for detail content.

Each project should have a `detail` object with `overview`, `implementation`, `challenges`, `results`, `techStack`.

---

#### File 4: `lib/item-details.ts`

The function that fetches full detail for the AI tool.

```typescript
import { getProjects } from './data';

export function getItemDetail(id: string): string {
  const project = getProjects().find(p => p.workspaceId === id);
  if (!project) return 'No detail found.';
  
  const d = project.detail ?? {};
  const parts = [`**${project.title}** · ${project.year}`];
  if (d.overview) parts.push(d.overview);
  if (d.implementation) parts.push(`Technical: ${d.implementation}`);
  if (d.results) parts.push(`Results: ${d.results}`);
  return parts.join('\n\n');
}
```

**Why fourth**: The tools file imports this. Get the data layer right before defining tool behavior.

---

#### File 5: `lib/chat-tools.ts`

Define the three tools. This is the contract between your system and the AI model.

```typescript
import { tool, type InferUITools, type UIDataTypes, type UIMessage } from 'ai';
import { z } from 'zod';
import { CHAT_LINKS, type ChatLinkKey } from './chat-links';
import { getItemDetail } from './item-details';

const LINK_KEYS = Object.keys(CHAT_LINKS) as [ChatLinkKey, ...ChatLinkKey[]];

const WORKSPACE_IDS = [
  'project-1',
  'project-2',
  // ... all valid IDs
] as const;

export const chatTools = {
  getItemDetails: tool({
    description: 'Fetch full detail for a specific item. Call before answering in depth.',
    inputSchema: z.object({
      id: z.enum(WORKSPACE_IDS),
    }),
    execute: async ({ id }) => getItemDetail(id),
  }),

  showReference: tool({
    description: 'Highlight the workspace card for an item you\'re discussing.',
    inputSchema: z.object({
      id: z.enum(WORKSPACE_IDS),
      type: z.enum(['project', 'research', 'experience']),
      title: z.string(),
    }),
    execute: async () => null,
  }),

  showLink: tool({
    description: 'Show a clickable link chip for contact/social requests.',
    inputSchema: z.object({
      target: z.enum(LINK_KEYS),
    }),
    execute: async () => null,
  }),
};

export type ChatMessage = UIMessage<unknown, UIDataTypes, InferUITools<typeof chatTools>>;
```

**Critical**: Every valid `workspaceId` must appear in `WORKSPACE_IDS`. If you add a project to `projects.json` but forget this array, the AI will try to call `getItemDetails({ id: 'new-project' })` and Zod will reject it with a validation error.

**Why export `ChatMessage` type**: `useChat<ChatMessage>` on the client gets type-safe `parts`. Without this, `part.type` is just `string`.

---

#### File 6: `app/api/chat/route.ts`

The API route. Wire everything together.

```typescript
import { google } from '@ai-sdk/google';
import { streamText, convertToModelMessages, smoothStream, stepCountIs } from 'ai';
import { getChatContext } from '@/lib/chat-context';
import { chatTools } from '@/lib/chat-tools';

export const maxDuration = 30;

export async function POST(req: Request) {
  // 1. Parse body
  let messages: unknown[];
  try {
    const body = await req.json();
    messages = body.messages;
    if (!Array.isArray(messages)) throw new Error('bad shape');
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  // 2. Input length guard
  const lastMsg = messages[messages.length - 1] as Record<string, unknown>;
  const lastText = typeof lastMsg?.content === 'string' ? lastMsg.content : '';
  if (lastText.length > 500) {
    return Response.json({ error: 'Message too long.' }, { status: 400 });
  }

  // 3. History truncation at UIMessage boundaries
  const MAX_TURNS = 3;
  const userMsgIndices = (messages as Array<{ role: string }>).reduce<number[]>(
    (acc, m, i) => (m.role === 'user' ? [...acc, i] : acc), []
  );
  const sliceFrom = userMsgIndices.length > MAX_TURNS
    ? userMsgIndices[userMsgIndices.length - MAX_TURNS]
    : 0;
  const slicedMessages = messages.slice(sliceFrom);

  // 4. Convert to model messages
  const modelMessages = await convertToModelMessages(
    slicedMessages as Parameters<typeof convertToModelMessages>[0],
    { tools: chatTools, ignoreIncompleteToolCalls: true }
  );

  // 5. Build system prompt
  const context = getChatContext();
  const systemPrompt = `You are an AI assistant on my portfolio...
<context>${context}</context>`;

  // 6. Stream
  const result = streamText({
    model: google('gemini-2.5-flash'),
    system: systemPrompt,
    messages: modelMessages,
    tools: chatTools,
    stopWhen: stepCountIs(6),
    experimental_transform: smoothStream(),
    maxOutputTokens: 600,
  });

  return result.toUIMessageStreamResponse();
}
```

**Common mistakes**:
- Forgetting `export const maxDuration = 30` — Next.js has a 10s default limit; streaming responses need more
- Slicing model messages instead of UI messages (breaks tool call integrity)
- Not calling `convertToModelMessages` with `{ tools: chatTools }` — tool call deserialization requires knowing the tool schemas

---

#### File 7: `components/ChatSection.tsx`

The UI component. Connect `useChat` to the display.

Key pattern for `useChat`:
```typescript
const { messages, sendMessage, status } = useChat<ChatMessage>({
  transport: new DefaultChatTransport({ api: '/api/chat' }),
  onError: (err) => setErrorMsg('Something went wrong.'),
  onFinish: () => setErrorMsg(null),
});
```

Key pattern for rendering tool parts:
```typescript
{msg.parts.map((part, i) => {
  if (part.type === 'text') return <Markdown>{part.text}</Markdown>;
  if (part.type === 'tool-showLink' && part.state === 'input-available') {
    const link = CHAT_LINKS[part.input.target];
    return <a href={link.url}>{link.label}</a>;
  }
  return null; // showReference is handled via useEffect, not rendered
})}
```

Key pattern for the showReference detection:
```typescript
useEffect(() => {
  const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
  if (!lastAssistant) { onReferencedIdsChange?.([]); return; }
  const ids = lastAssistant.parts
    .filter(p => p.type === 'tool-showReference' && 
                 (p.state === 'input-available' || p.state === 'output-available'))
    .map(p => p.input.id);
  onReferencedIdsChange?.(ids);
}, [messages, onReferencedIdsChange]);
```

**Common mistakes**:
- Defining `mdComponents` inside the component — causes markdown to re-mount on every token
- Using `part.state === 'output-available'` only — cards won't highlight until after the null tool result arrives (adds visible delay). Use `||` with `input-available`.
- Forgetting `onReferencedIdsChange?.([])` when there's no assistant message — stale highlights persist

---

#### File 8: `components/ContextPanel.tsx` and `ContextCard.tsx`

The workspace card column. Receive `cards`, `selectedId`, `referencedIds` as props. Render `ContextCard` for each.

`ContextCard` needs:
- A container `className` with `group` for hover effects
- An `AnimatePresence` wrapping a highlighted ring span that shows when `referenced={true}`
- A `useEffect` that calls `scrollIntoView` on `false → true` transition (watch `wasReferenced` ref)

---

#### File 9: `components/ConversationLayout.tsx`

The orchestrator. Owns `selectedId` and `referencedIds` state. Renders the three-column layout.

```typescript
const [selectedId, setSelectedId] = useState<string | null>(null);
const [referencedIds, setReferencedIds] = useState<string[]>([]);

// Pass setReferencedIds down to ChatSection
<ChatSection
  mode="workspace"
  onReferencedIdsChange={setReferencedIds}
/>
// Pass referencedIds to ContextPanel
<ContextPanel
  cards={workspaceCards}
  referencedIds={referencedIds}
  selectedId={selectedId}
  onSelect={setSelectedId}
/>
```

---

#### File 10: Wire everything in `app/page.tsx`

```typescript
// Server component
import { getWorkspaceCards } from '@/lib/data';

export default async function Home() {
  const workspaceCards = getWorkspaceCards();
  return <PortfolioPage workspaceCards={workspaceCards} />;
}
```

---

### Implementation order recap

1. `lib/chat-links.ts` — pure data
2. `lib/chat-context.ts` — index string
3. `data/projects.json` — project data with `detail` fields
4. `lib/item-details.ts` — detail formatter
5. `lib/chat-tools.ts` — tool definitions + `ChatMessage` type
6. `app/api/chat/route.ts` — API route
7. `components/ChatSection.tsx` — chat UI
8. `components/ContextCard.tsx` + `ContextPanel.tsx` — workspace cards
9. `components/ConversationLayout.tsx` — three-column orchestrator
10. `app/page.tsx` — entry point wiring

---

## Part 14 — Interview Preparation

### 30 Architecture Questions with Answers

---

**Q1. What is the Vercel AI SDK and why was it chosen?**

The Vercel AI SDK (`ai` package) is a TypeScript library that abstracts AI providers behind a unified interface, handles streaming response protocols, manages tool call execution loops, and provides React hooks for state management. It was chosen because it eliminates the need to implement provider-specific streaming protocols, manage SSE serialization, handle tool call agentic loops, or build React state management from scratch. One import change swaps the underlying model.

**Follow-up**: Could you implement the same without the SDK? Yes — you'd call the Gemini REST API directly, read the streaming response body, parse the ndjson or SSE format Gemini uses, detect tool call events manually, call your tool functions, feed results back in another API call, and manage all of this in React. The SDK is not magic — it's a well-designed abstraction over exactly these steps.

---

**Q2. Explain the difference between UIMessage and ModelMessage.**

`UIMessage` is the React-state format — one object per turn, with all content (text, tool calls, tool results) as a flat `parts[]` array. It's human-readable and renderable in React. `ModelMessage` is the provider API format — tool calls and results are separate messages. One UIMessage can expand into 3-6 ModelMessages. `convertToModelMessages()` handles this expansion. The distinction matters for history truncation: you must slice UIMessages (not ModelMessages) to avoid orphaned tool calls.

---

**Q3. What is Server-Sent Events (SSE) and why use it instead of WebSockets for this chatbot?**

SSE is a protocol for a server to push data to a client over a persistent HTTP connection. It's unidirectional (server to client). Each message is a plain text line: `data: <payload>\n\n`. The connection closes when the server is done. WebSockets are bidirectional and require a protocol upgrade handshake — overkill for a chatbot where each exchange is one POST that returns one stream. SSE works over standard HTTP, is automatically supported by `fetch` as a `ReadableStream`, and has the right lifecycle for request-response-stream-close.

---

**Q4. What is `smoothStream()` and when would you remove it?**

`smoothStream()` is an AI SDK experimental transform that buffers token delivery and re-emits them at a controlled rate to smooth out bursts from the model API. Gemini can deliver tokens in large chunks separated by pauses; `smoothStream()` creates a more even drip. You'd remove it if the added buffer delay (typically ~100ms) was unacceptable for the UX, or if you were debugging streaming behavior and wanted to see raw token delivery patterns.

---

**Q5. Why does `showReference` return `null` from its execute function?**

The `showReference` tool is a UI-effect tool — its purpose is to leave a trace in the UIMessage parts that the frontend reads. The tool result (`null`) is sent back to the model to close the tool-call step (so the model can continue generating text). The model doesn't use this null — it just needs *some* result to proceed. The actual effect happens on the client: `ChatSection`'s `useEffect` reads `part.input.id` from the tool-call part and fires `onReferencedIdsChange`.

---

**Q6. What happens if you add a new project to `projects.json` but forget to add it to `WORKSPACE_IDS` in `chat-tools.ts`?**

Gemini might try to call `getItemDetails({ id: 'new-project' })`. Zod validates the input against the `WORKSPACE_IDS` enum before `execute()` is called. If `'new-project'` isn't in the enum, Zod rejects the call with a validation error. The AI SDK treats this as a failed tool call. Gemini might retry with a different approach or report that it can't find detail. The fix is to add the new ID to the `WORKSPACE_IDS` array.

---

**Q7. Explain the history truncation logic. Why slice at UIMessage boundaries?**

The route keeps the last `MAX_TURNS` user messages. It finds the indices of all user messages in the array, then slices from the index of the `(total - MAX_TURNS)`th user message. This preserves complete conversation turns.

If you instead sliced `modelMessages.slice(-10)`, you might cut a conversation mid-expansion: keeping an assistant message that called a tool but removing the tool result message. Gemini then sees a conversation with a tool call and no matching result — an invalid state that causes hallucination or unexpected output.

---

**Q8. What is `stepCountIs(6)` and what problem does it solve?**

The AI SDK runs an "agentic loop" when tools are provided: model calls tool → SDK executes → SDK feeds result back → model calls another tool → ... The loop continues until the model produces pure text (no more tool calls). Without a stop condition, a buggy prompt or model could loop indefinitely. `stepCountIs(6)` halts after 6 steps. In this chatbot, worst case is 2 items × (getItemDetails + showReference) = 4 tool steps + 1 text step = 5 steps. 6 gives one step of headroom.

---

**Q9. Why is `mdComponents` defined at module level outside the `ChatSection` component?**

If defined inside the component, a new object reference is created on every render. `react-markdown` receives a new `components` prop → it compares by reference → sees a different object → re-mounts the entire rendered DOM tree. During streaming, `ChatSection` re-renders on every token. Re-mounting markdown on every token causes visible flicker and DOM thrashing. Module-level = one stable reference forever = no re-mounting.

---

**Q10. What is `convertToModelMessages` and when is it called?**

`convertToModelMessages` is an AI SDK utility that converts `UIMessage[]` (React state format) to `ModelMessage[]` (provider API format). It's called in the API route, after history truncation but before calling `streamText`. It requires `{ tools: chatTools }` so it knows how to deserialize tool call parts in existing messages. It also accepts `{ ignoreIncompleteToolCalls: true }` as a safety valve that drops tool calls without matching results.

---

**Q11. What are the four status values from `useChat` and how are they used?**

- `'idle'` — no active request; default state
- `'submitted'` — POST sent, waiting for first byte (use to show "thinking" indicator)
- `'streaming'` — tokens arriving (use to show streaming cursor, disable input)
- `'error'` — request failed (use to show error message)

In `ChatSection`, `isGenerating = status === 'submitted' || status === 'streaming'`. This disables the input textarea and send button during active requests.

---

**Q12. How does a user clicking a workspace card interact with what the AI is saying?**

Independently. `ConversationLayout` owns both `selectedId` (from user clicks) and `referencedIds` (from AI `showReference` calls). A card can be in four states:
- Neither selected nor referenced: default
- Referenced only: glowing ring (AI mentioned it, user hasn't clicked)
- Selected only: detail panel open, no ring (user clicked it, AI isn't discussing it)
- Both: detail panel open AND glowing ring

The two pieces of state never conflict — they coexist and each card renders the appropriate visual state.

---

**Q13. What is `DefaultChatTransport` and when would you replace it?**

`DefaultChatTransport` is the built-in transport for `useChat` that sends messages via `fetch` POST and reads the SSE response. You'd replace it with a custom transport if you needed: WebSockets instead of HTTP, authentication headers on every request, a different URL strategy (e.g., per-session endpoints), or request/response interceptors. The custom transport must implement the AI SDK's transport interface.

---

**Q14. Why does the system prompt use a two-layer approach (short index + tool for detail)?**

8 items × 500 tokens of detail = 4000 tokens injected into every request, even for questions about a single item. The two-layer approach puts only ~10 tokens per item in the system prompt (title, category, tags). Full detail is fetched on-demand via `getItemDetails`. This reduces average request cost by ~75% and keeps the system prompt compact. The trade-off: one extra round-trip to the model per item queried.

---

**Q15. What is `InferUITools<typeof chatTools>` and why does it matter?**

`InferUITools` is an AI SDK utility type that, given a tools definition, produces a discriminated union of all possible tool part types with their exact input and output shapes. `UIMessage<unknown, UIDataTypes, InferUITools<typeof chatTools>>` gives each message's `parts[]` an exhaustive type. When you write `part.type === 'tool-showReference'`, TypeScript narrows `part.input` to `{ id: WorkspaceId, type: ..., title: string }`. Without this, `part.input` would be `unknown` and you'd need manual casts everywhere.

---

**Q16. What does `result.toUIMessageStreamResponse()` return?**

It returns a standard Web API `Response` object with:
- Status 200
- `Content-Type: text/event-stream`
- `Cache-Control: no-cache`
- A `ReadableStream` body containing SSE-formatted events

Each event encodes one chunk of the AI SDK's stream (text delta, tool call, tool result, finish event). The `DefaultChatTransport` on the client reads this stream and processes each event.

---

**Q17. How would you add a new tool to this chatbot?**

1. Add the tool to `chatTools` in `lib/chat-tools.ts` with a description, `inputSchema` (Zod), and `execute` function
2. If the tool should affect the UI, detect `part.type === 'tool-yourToolName'` in `ChatSection`'s message renderer
3. The `ChatMessage` type auto-updates via `InferUITools<typeof chatTools>`
4. Update the system prompt in `route.ts` to explain when/how to use the new tool
5. No other files need changing

---

**Q18. How does the chatbot handle the "thinking" state visually?**

When `status === 'submitted'` (request sent, no tokens yet), `ChatSection` renders a separate div with three animated dots:

```tsx
{status === 'submitted' && (
  <div key="thinking">
    <p>Swethank</p>
    <span aria-label="Thinking">
      {[0, 1, 2].map(i => (
        <span className="animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
      ))}
    </span>
  </div>
)}
```

Three dots with staggered animation delays (0ms, 150ms, 300ms) create the visual "..." pulse effect. When `status` transitions from `'submitted'` to `'streaming'`, the dots `AnimatePresence` exit and the actual streaming text begins.

---

**Q19. Why is `workspaceCards` fetched at server render time rather than client-side?**

1. `fs.readFileSync` (used in `lib/data.ts`) only works on the server — you can't read filesystem from the browser
2. The card data is static between deployments — no need to re-fetch it on the client
3. Passing it as props means the workspace panel is populated on initial render with zero loading states
4. If card data could change at runtime (e.g., admin updates), you'd either trigger ISR revalidation or use a client-side fetch with SWR/React Query

---

**Q20. What is `maxDuration = 30` in the route file?**

Next.js App Router Route Handlers have a default execution time limit (10 seconds for serverless functions). A streaming response stays open until all tokens are delivered — easily exceeding 10 seconds for a long response. `export const maxDuration = 30` sets the limit to 30 seconds. On Vercel's Pro plan this can be extended further.

---

**Q21. How would you switch from Gemini to Claude?**

```bash
npm install @ai-sdk/anthropic
```

In `route.ts`:
```typescript
// Before:
import { google } from '@ai-sdk/google';
const model = google('gemini-2.5-flash');

// After:
import { anthropic } from '@ai-sdk/anthropic';
const model = anthropic('claude-sonnet-4-6');
```

Add `ANTHROPIC_API_KEY` to env. Remove `GOOGLE_GENERATIVE_AI_API_KEY`. Everything else — tools, streaming, history truncation, client code — stays identical. This is the AI SDK's key promise.

---

**Q22. What prevents the chatbot from answering off-topic questions?**

The system prompt's Rules section:
```
- Do not write code for users.
- Do not answer questions unrelated to Swethank or this portfolio.
```

This is a behavioral instruction, not a technical constraint. A sufficiently adversarial prompt could bypass it. For a portfolio chatbot, this is acceptable — the risk profile is low. For a production system with higher stakes, you'd add a separate classifier step that rejects off-topic inputs before they reach the main model.

---

**Q23. What is the purpose of `useScrollFade` and how does it work?**

`useScrollFade` manages the scrollbar visibility in the workspace chat panel. Scrollbars are hidden at rest (opacity 0) and revealed when scrolling. The hook attaches a `scroll` event listener. When the user scrolls, it adds `.is-scrolling` to the element, which CSS uses to fade the scrollbar in. After 1200ms of inactivity, `.is-scrolling` is removed and the scrollbar fades out again. The CSS uses both `scrollbar-color` (Firefox) and `::-webkit-scrollbar-thumb` (Chrome/Safari) for cross-browser support.

---

**Q24. Why does the chat input use a `<textarea>` instead of `<input type="text">`?**

1. Auto-resize: the input expands vertically as the user types multiple lines using `onInput` → set `style.height = scrollHeight + 'px'`
2. `Shift+Enter` support: `<textarea>` lets the user add line breaks without submitting
3. Multi-line messages: some questions naturally span multiple lines
4. The `onKeyDown` handler captures `Enter` (without Shift) to submit, preventing the default newline behavior

---

**Q25. What is `getChatContext()` and why is it a function, not a constant?**

`getChatContext()` returns a dynamically-built string injected into every system prompt. It calls `getPublishedWriting()` and `getCurrentStatus()`, which both read from disk (`data/writing.json`, `data/current.json`). These files can change at runtime via the admin panel. If it were a module-level constant, it would be built once at server startup and never reflect admin changes. As a function, it reads fresh data on every request.

---

**Q26. What is Zod and how is it used in this chatbot?**

Zod is a TypeScript-first schema validation library. In this chatbot, it defines tool input schemas:

```typescript
inputSchema: z.object({
  id: z.enum(WORKSPACE_IDS),
})
```

When the AI calls a tool, the AI SDK validates the AI's proposed input against this schema before calling `execute()`. If the AI provides an invalid ID (not in `WORKSPACE_IDS`), Zod rejects it. This prevents `execute()` from receiving invalid data and ensures TypeScript types are accurate.

---

**Q27. How does rate limiting work and what happens when it's exceeded?**

Rate limiting uses Upstash Redis with a `fixedWindow` strategy. Each request increments a counter keyed by `chat_{ip}` with a 1-day TTL. When the counter exceeds the limit (10/day in production), `ratelimit.limit()` returns `{ success: false }` and the route returns `Response.json({ error: 'Daily limit reached.' }, { status: 429 })`.

On the client, `useChat`'s `onError` callback checks if the error message includes '429' or 'limit' and sets `errorMsg` to "Daily limit reached. Come back tomorrow."

If Upstash env vars aren't set, the rate limiting block is skipped entirely — useful for development or self-hosted deployments without Redis.

---

**Q28. What is the `llms.txt/route.ts` file for?**

`/llms.txt` is a convention (similar to `robots.txt`) for telling AI crawlers and systems what a site contains. The route returns `getChatContext()` as plain text — the same index string that gets injected into the chatbot's system prompt. If an AI system or LLM indexes this site, it gets a structured, human-readable summary of who Swethank is and what he's built.

---

**Q29. How do you debug a situation where the workspace card doesn't highlight even though the AI mentions a project?**

Step-by-step:
1. Open Browser DevTools → Network → find the POST `/api/chat` request → check the response body SSE events for `tool-showReference` events
2. Add `console.log(msg.parts)` in the `useEffect` in ChatSection that detects `showReference` — verify the part exists and has the right state
3. Add `console.log('referencedIds', ids)` before calling `onReferencedIdsChange` — verify the IDs are non-empty
4. Add `console.log('referencedIds', referencedIds)` in ContextPanel — verify the prop is arriving
5. Add `console.log(card.id, referencedIds.includes(card.id))` in ContextCard — verify the match
6. Check that the `id` in `showReference` matches the card's `id` exactly (case-sensitive)

---

**Q30. How would you add memory so the chatbot remembers returning visitors?**

1. On first visit, set a session ID cookie (`crypto.randomUUID()`)
2. After each conversation, summarize the exchanges and store them keyed by session ID in Redis or a database
3. In the API route, read the session cookie from request headers, fetch the stored summary
4. Inject the summary into the system prompt: `<memory>${summary}</memory>`
5. Cap memory at ~200 tokens to avoid bloating the prompt

The AI SDK and route don't need structural changes — memory is just another string injected into the system prompt.

---

## Part 15 — File-by-File Reference

| File | Type | Purpose | Key Dependencies |
|---|---|---|---|
| `app/page.tsx` | Server Component | Entry point; reads disk data; passes workspaceCards to client | `lib/data.ts` |
| `components/PortfolioPage.tsx` | Client Component | Owns `mode` state (portfolio/conversation); renders Hero or ConversationLayout | `ConversationLayout`, `Hero` |
| `components/ConversationLayout.tsx` | Client Component | Owns `selectedId` + `referencedIds`; orchestrates 3-column layout | `ChatSection`, `ContextPanel`, `CardDetail` |
| `components/ChatSection.tsx` | Client Component | All chat UI; calls `useChat`; detects tool calls; fires callbacks | `@ai-sdk/react`, `lib/chat-tools.ts`, `lib/chat-links.ts` |
| `components/ContextPanel.tsx` | Client Component | Scrollable workspace card column; staggered entry animation | `ContextCard`, `lib/data.ts` |
| `components/ContextCard.tsx` | Client Component | Individual workspace card; hover effects; reference ring; GitHub icon | `lib/data.ts` |
| `components/CardDetail.tsx` | Client Component | Right-column detail view for a clicked workspace card | `lib/data.ts` |
| `app/api/chat/route.ts` | Route Handler | Validates, rate-limits, truncates, streams; calls Gemini | `ai`, `@ai-sdk/google`, `lib/chat-context.ts`, `lib/chat-tools.ts` |
| `lib/chat-tools.ts` | Server lib | Defines 3 tools + `ChatMessage` type | `ai`, `zod`, `lib/item-details.ts`, `lib/chat-links.ts` |
| `lib/chat-context.ts` | Server lib | Builds system prompt context string from published data | `lib/data.ts` |
| `lib/item-details.ts` | Server lib | `getItemDetail(id)` — reads projects.json, formats AI detail string | `lib/data.ts` |
| `lib/chat-links.ts` | Shared | Link URL/label map for `showLink` tool | none |
| `lib/use-scroll-fade.ts` | Client hook | Manages scrollbar visibility via `.is-scrolling` class | React |
| `lib/motion.ts` | Shared | Easing curves + spring configs for Framer Motion | none |
| `app/llms.txt/route.ts` | Route Handler | Returns chatbot context as plain text for AI crawlers | `lib/chat-context.ts` |
| `data/projects.json` | Data | All project data including `detail` fields | none (JSON) |

---

## Appendix: Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Yes | Gemini API access |
| `UPSTASH_REDIS_REST_URL` | No | Rate limiting (Upstash Redis) |
| `UPSTASH_REDIS_REST_TOKEN` | No | Rate limiting (Upstash Redis) |
| `ADMIN_SECRET` | Yes (for admin) | Admin panel authentication |

If both Upstash variables are missing, rate limiting is silently disabled. No code changes needed.

---

## Appendix: Quick Mental Model

```
DATA LAYER (disk, server-only)
  data/projects.json
  data/current.json
  data/writing.json
       ↓
  lib/data.ts (getWorkspaceCards, getProjects, ...)
       ↓
AI CONTEXT (server, built per request)
  lib/chat-context.ts → short index (~600 tokens)
  lib/item-details.ts → getItemDetail(id) → full detail (~500 tokens each)
       ↓
TOOLS (server, Zod-validated)
  lib/chat-tools.ts
    getItemDetails → execute: getItemDetail(id)
    showReference  → execute: null
    showLink       → execute: null
       ↓
API ROUTE (server, streaming)
  app/api/chat/route.ts
    validate → rate-limit → truncate → streamText → SSE response
       ↓
TRANSPORT (browser)
  DefaultChatTransport → fetch POST → ReadableStream SSE
       ↓
STATE (browser, React)
  useChat<ChatMessage> → messages: UIMessage[]
       ↓
UI (browser, React)
  ConversationLayout → [selectedId, referencedIds]
  ChatSection → renders messages, fires onReferencedIdsChange
  ContextPanel → passes referenced={true} to matching ContextCard
  ContextCard → shows glowing ring when referenced
  CardDetail → shows clicked card's description + tags
```

---

*End of SWETHANK_CHATBOT_ARCHITECTURE.md*
*Last updated: June 2026 — reflects the actual production codebase, not a hypothetical.*
