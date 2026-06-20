'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Markdown from 'react-markdown';
import { EASE_OUT, SPRING_SNAP } from '@/lib/motion';
import { useScrollFade } from '@/lib/use-scroll-fade';
import { CHAT_LINKS } from '@/lib/chat-links';
import { useMessageQuota } from '@/lib/use-message-quota';
import type { ChatMessage } from '@/lib/chat-tools';

// Module-level so the object reference is stable across renders (avoids
// react-markdown re-mounting DOM nodes on every streaming token).
const mdComponents: React.ComponentProps<typeof Markdown>['components'] = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-ink/90">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="my-2 list-disc pl-5 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal pl-5 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  code: ({ children }) => (
    <code className="rounded bg-ink/[0.07] px-1 font-mono text-[14px]">{children}</code>
  ),
};

// Wraps the native fetch to intercept X-RateLimit-Remaining from the SSE
// response headers — no extra round-trip, the header arrives with the stream.
function createQuotaFetch(onQuota: (remaining: number) => void) {
  return async function quotaFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const response = await fetch(input, init);
    const header = response.headers.get('X-RateLimit-Remaining');
    if (header !== null) {
      const parsed = parseInt(header, 10);
      if (!Number.isNaN(parsed)) onQuota(parsed);
    }
    return response;
  };
}

interface ChatSectionProps {
  onHeightChange?: () => void;
  onReferencedIdsChange?: (ids: string[]) => void;
  /** 'page' — below-fold scroll mode. 'workspace' — fills container with pinned input. */
  mode?: 'page' | 'workspace';
}

export default function ChatSection({
  onHeightChange,
  onReferencedIdsChange,
  mode = 'page',
}: ChatSectionProps) {
  const rm = useReducedMotion();
  const [input, setInput] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { remaining, increment, syncFromServer } = useMessageQuota();

  // Stable fetch wrapper — re-created only when syncFromServer identity changes
  // (which is never, since it's a useCallback with no deps).
  const quotaFetch = useMemo(() => createQuotaFetch(syncFromServer), [syncFromServer]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useScrollFade(scrollContainerRef);

  const { messages, sendMessage, status } = useChat<ChatMessage>({
    transport: new DefaultChatTransport({ api: '/api/chat', fetch: quotaFetch }),
    onError: (err) => {
      const msg = err.message?.toLowerCase() ?? '';
      if (msg.includes('429') || msg.includes('limit')) {
        setErrorMsg('Daily limit reached. Come back tomorrow.');
      } else if (msg.includes('too long') || msg.includes('500 char')) {
        setErrorMsg('Message too long. Please keep your message under 500 characters.');
      } else {
        setErrorMsg('Something went wrong. Please try again.');
      }
    },
    onFinish: () => setErrorMsg(null),
  });

  const isGenerating = status === 'submitted' || status === 'streaming';

  // Derived — used to gate send and drive footer / validation UI
  const charCount = input.length;
  const inputTooLong = input.trim().length > 500;
  const charNearLimit = charCount > 400 && !inputTooLong;
  const limitReached = remaining === 0 || errorMsg?.toLowerCase().includes('limit') === true;

  async function handleSend() {
    const text = input.trim();
    if (!text || isGenerating) return;
    // Client-side char validation must run BEFORE increment so a blocked
    // message never consumes a quota slot.
    if (text.length > 500) return;
    setInput('');
    setErrorMsg(null);
    increment();
    await sendMessage({ text });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSend();
  }

  // Reflect only the LAST assistant message's showReference calls.
  // Clears when the latest AI message has no tool calls (greeting, off-topic, etc.).
  useEffect(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
    if (!lastAssistant) {
      onReferencedIdsChange?.([]);
      return;
    }
    const ids: string[] = [];
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

  // Auto-scroll to bottom on new content
  useEffect(() => {
    if (messages.length === 0) return;
    if (mode === 'workspace' && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    onHeightChange?.();
  }, [messages, mode, onHeightChange]);

  // Auto-focus in workspace mode
  useEffect(() => {
    if (mode === 'workspace') {
      const t = setTimeout(() => inputRef.current?.focus(), 350);
      return () => clearTimeout(t);
    }
  }, [mode]);

  // ── Message renderer ────────────────────────────────────────────────────────

  const transcript = (
    <div className="space-y-10">
      <AnimatePresence initial={false}>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={rm ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={rm ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={rm ? { duration: 0 } : { duration: 0.32, ease: EASE_OUT }}
          >
            {msg.role === 'user' ? (
              <div>
                <p className="mb-3 text-[10px] uppercase tracking-[0.14em] text-muted/50">You</p>
                <p className="text-[17px] font-medium leading-[1.47] text-ink">
                  {msg.parts
                    .filter((p) => p.type === 'text')
                    .map((p) => (p as { type: 'text'; text: string }).text)
                    .join('')}
                </p>
              </div>
            ) : (
              <div>
                <p className="mb-3 text-[10px] uppercase tracking-[0.14em] text-muted/50">Swethank</p>
                <div className="space-y-3">
                  {msg.parts.map((part, i) => {
                    if (part.type === 'text') {
                      const isLastText =
                        i === msg.parts.filter((p) => p.type === 'text').length - 1;
                      return (
                        <div
                          key={i}
                          className="text-[17px] leading-[1.6] tracking-[-0.01em] text-ink/80"
                        >
                          <Markdown components={mdComponents}>{part.text}</Markdown>
                          {isGenerating && isLastText && (
                            <span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-ink/40" />
                          )}
                        </div>
                      );
                    }

                    // showLink tool — render a clickable link chip
                    if (
                      part.type === 'tool-showLink' &&
                      part.state === 'input-available'
                    ) {
                      const link = CHAT_LINKS[part.input.target];
                      if (!link) return null;
                      return (
                        <a
                          key={i}
                          href={link.url}
                          target={link.url.startsWith('mailto:') ? undefined : '_blank'}
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-ink/[0.12] bg-white/50 px-3 py-1.5 text-[13px] text-ink/70 transition-colors duration-150 hover:border-ink/25 hover:text-ink"
                        >
                          {link.label}
                          <span aria-hidden className="text-[11px]">↗</span>
                        </a>
                      );
                    }

                    // showReference — silent; handled via onReferencedIdsChange callback
                    return null;
                  })}
                </div>
              </div>
            )}
          </motion.div>
        ))}

        {/* Thinking indicator */}
        {status === 'submitted' && (
          <motion.div
            key="thinking"
            initial={rm ? { opacity: 0 } : { opacity: 0, y: 4 }}
            animate={rm ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={rm ? { duration: 0 } : { duration: 0.2, ease: EASE_OUT }}
          >
            <p className="mb-3 text-[10px] uppercase tracking-[0.14em] text-muted/50">Swethank</p>
            <span className="inline-flex items-end gap-[4px]" aria-label="Thinking">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-[5px] w-[5px] rounded-full bg-ink/35"
                  animate={rm ? {} : { y: [0, -4, 0], opacity: [0.35, 0.7, 0.35] }}
                  transition={rm ? { duration: 0 } : {
                    duration: 1.1,
                    repeat: Infinity,
                    delay: i * 0.18,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </span>
          </motion.div>
        )}

        {/* Error state */}
        {errorMsg && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[15px] text-muted/60"
          >
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ── Shared input element ────────────────────────────────────────────────────

  const inputEl = (
    <textarea
      ref={inputRef}
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={handleKeyDown}
      onFocus={() => setInputFocused(true)}
      onBlur={() => setInputFocused(false)}
      placeholder={
        limitReached
          ? 'Daily limit reached. Come back tomorrow.'
          : messages.length === 0
          ? 'Ask about AI, research, projects, or IIT Bombay...'
          : 'Continue the conversation...'
      }
      rows={1}
      disabled={isGenerating || limitReached}
      className={[
        'flex-1 resize-none appearance-none bg-transparent py-[13px] text-[15px] leading-[1.5] text-ink placeholder:text-ink/32 outline-none ring-0 shadow-none focus:outline-none focus:ring-0 focus:shadow-none transition-opacity duration-300',
        isGenerating || limitReached ? 'opacity-40' : 'opacity-100',
      ].join(' ')}
      style={{ maxHeight: '120px' }}
      onInput={(e) => {
        const t = e.currentTarget;
        t.style.height = 'auto';
        t.style.height = `${t.scrollHeight}px`;
      }}
      aria-label="Your message"
    />
  );

  const sendButton = (
    <motion.button
      type="button"
      onClick={handleSend}
      disabled={!input.trim() || isGenerating || inputTooLong || limitReached}
      className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-ink text-surface transition-opacity disabled:opacity-20"
      aria-label="Send message"
      whileTap={rm ? {} : { scale: 0.88 }}
      transition={SPRING_SNAP}
    >
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
        <path
          d="M6.5 11V2M2 6.5l4.5-4.5 4.5 4.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.button>
  );

  // ── Composer footer — usage + trust indicator ───────────────────────────────

  // Right side of footer rotates between three states.
  // Priority: char indicator (approaching or over) > daily limit > question counter.
  // A stable key per state avoids per-keystroke transitions while typing near the limit.
  const footerRightKey = (charNearLimit || inputTooLong)
    ? 'char'
    : limitReached
    ? 'limit'
    : `q-${remaining}`;

  const footerRightText = (charNearLimit || inputTooLong)
    ? `${charCount} / 500`
    : limitReached
    ? 'Daily limit reached. Come back tomorrow.'
    : `${remaining} / 10 remaining today`;

  const composerFooter = (
    <div className="mx-auto max-w-[640px] px-6 pb-3 sm:px-8">
      {/* Row 1: permanent disclaimer + contextual right indicator */}
      <div className="flex items-center justify-between gap-4">
        <span className="text-[11px] leading-none text-ink/28 shrink-0">
          AI can make mistakes. Verify important information.
        </span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={footerRightKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={rm ? { duration: 0 } : { duration: 0.25 }}
            className="text-[11px] leading-none text-ink/28 tabular-nums whitespace-nowrap"
          >
            {footerRightText}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Row 2: full validation message — slides in when over the character limit */}
      <AnimatePresence>
        {inputTooLong && (
          <motion.p
            key="char-error"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={rm ? { duration: 0 } : { duration: 0.2 }}
            style={{ overflow: 'hidden' }}
            className="mt-1 text-[11px] text-ink/45"
          >
            Message too long. Please keep your message under 500 characters.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );

  // ── Workspace mode — fills container, pinned input ──────────────────────────
  if (mode === 'workspace') {
    return (
      <div className="flex h-full flex-col overflow-hidden" aria-label="Conversation with Swethank">
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scroll-fade">
          <div className="mx-auto max-w-[640px] px-6 py-10 sm:px-8">
            {messages.length === 0 && !isGenerating && (
              <motion.p
                initial={rm ? { opacity: 0 } : { opacity: 0, y: 4 }}
                animate={rm ? { opacity: 1 } : { opacity: 1, y: 0 }}
                transition={rm ? { duration: 0 } : { duration: 0.4, delay: 0.5, ease: EASE_OUT }}
                className="text-[15px] leading-[1.7] tracking-[-0.01em] text-muted/50"
              >
                Ask about my research, projects, or what I&apos;m building at IIT Bombay.
              </motion.p>
            )}
            {transcript}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="shrink-0">
          <form
            onSubmit={handleSubmit}
            className="mx-auto max-w-[640px] px-6 pt-4 pb-2 sm:px-8"
          >
            <div
              className={[
                'flex items-center gap-2 rounded-full px-3.5 transition-[border-color,box-shadow] duration-200',
                inputFocused
                  ? 'border border-ink/[0.14] bg-white/50 shadow-[0_0_0_3px_rgba(0,0,0,0.04)]'
                  : 'border border-ink/[0.08] bg-white/35',
              ].join(' ')}
            >
              {inputEl}
              {sendButton}
            </div>
          </form>
          {composerFooter}
        </div>
      </div>
    );
  }

  // ── Page mode — below-fold, scroll with page ────────────────────────────────
  return (
    <motion.section
      initial={rm ? { opacity: 0 } : { opacity: 0, y: 16 }}
      whileInView={rm ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={rm ? { duration: 0 } : { duration: 0.4, ease: EASE_OUT }}
      className="bg-surface border-t border-ink/[0.08]"
      aria-label="Conversation with Swethank"
    >
      <div className="mx-auto max-w-[640px] px-6 py-12 sm:px-10 lg:px-0">
        {transcript}

        <div
          className={`relative h-px w-full bg-ink/[0.08] ${messages.length > 0 ? 'my-10' : 'mt-0 mb-6'}`}
        >
          <motion.div
            className="absolute inset-0 bg-ink/20"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: inputFocused ? 1 : 0 }}
            style={{ originX: 0 }}
            transition={rm ? { duration: 0 } : { duration: 0.25, ease: EASE_OUT }}
          />
        </div>

        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder={
              limitReached
                ? 'Daily limit reached. Come back tomorrow.'
                : messages.length === 0
                ? 'Ask anything...'
                : 'Continue the conversation...'
            }
            rows={1}
            disabled={isGenerating || limitReached}
            className={[
              'flex-1 resize-none appearance-none bg-transparent text-[16px] leading-[1.6] text-ink placeholder:text-muted/40 outline-none ring-0 shadow-none focus:outline-none focus:ring-0 focus:shadow-none transition-opacity duration-300',
              isGenerating || limitReached ? 'opacity-40' : 'opacity-100',
            ].join(' ')}
            style={{ minHeight: '28px', maxHeight: '120px' }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = 'auto';
              t.style.height = `${t.scrollHeight}px`;
            }}
            aria-label="Your message"
          />
          <motion.button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isGenerating || inputTooLong || limitReached}
            className="mb-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-ink text-surface transition-opacity disabled:opacity-20"
            aria-label="Send message"
            whileTap={rm ? {} : { scale: 0.88 }}
            transition={SPRING_SNAP}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <path
                d="M6.5 11V2M2 6.5l4.5-4.5 4.5 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.button>
        </form>

        <div className="mt-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[11px] leading-none text-ink/28">
              AI can make mistakes. Verify important information.
            </span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={footerRightKey}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={rm ? { duration: 0 } : { duration: 0.25 }}
                className="text-[11px] leading-none text-ink/28 tabular-nums whitespace-nowrap"
              >
                {footerRightText}
              </motion.span>
            </AnimatePresence>
          </div>
          <AnimatePresence>
            {inputTooLong && (
              <motion.p
                key="char-error-page"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={rm ? { duration: 0 } : { duration: 0.2 }}
                style={{ overflow: 'hidden' }}
                className="mt-1 text-[11px] text-ink/45"
              >
                Message too long. Please keep your message under 500 characters.
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div ref={bottomRef} className="h-10" />
      </div>
    </motion.section>
  );
}
