'use client';

import { Fragment, useCallback, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { EASE_OUT } from '@/lib/motion';
import WritingDetailPanel from '@/components/WritingDetailPanel';
import type { WritingPost } from '@/lib/data';

function excerpt(text: string, max = 130): string {
  if (text.length <= max) return text;
  return text.slice(0, text.lastIndexOf(' ', max)) + '…';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function WritingClient({ posts }: { posts: WritingPost[] }) {
  const rm = useReducedMotion();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedPost = posts.find((p) => p.id === selectedId) ?? null;

  const handleSelect = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const handleClose = useCallback(() => setSelectedId(null), []);

  return (
    <main className="flex flex-1 overflow-hidden">

      {/* ── Left column: 55% ─────────────────────────────────────────────── */}
      <div className="flex-[11] min-w-0 overflow-y-auto pl-6 sm:pl-10 lg:pl-16 pr-6 lg:pr-14 py-16 lg:py-20">

        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted/50">
          Writing
        </p>
        <h1 className="mb-12 text-[32px] font-bold leading-[1.1] tracking-[-0.02em] text-ink">
          Essays &amp; Notes
        </h1>

        {posts.length === 0 ? (
          <p className="text-[17px] leading-[1.6] text-muted/60">Nothing published yet.</p>
        ) : (
          <div>
            {posts.map((post, i) => {
              const isSelected = selectedId === post.id;

              return (
                <Fragment key={post.id}>
                  {i > 0 && <div className="h-px bg-ink/[0.07]" />}

                  <article
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelect(post.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelect(post.id);
                      }
                    }}
                    className={[
                      'relative -mx-3 cursor-pointer rounded-xl px-3 py-9 outline-none',
                      'transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ink/20',
                      isSelected ? 'bg-ink/[0.04]' : 'hover:bg-ink/[0.025]',
                    ].join(' ')}
                  >
                    {/* Active indicator */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          className="absolute left-0 top-1/2 h-7 w-[2px] -translate-y-1/2 rounded-full bg-ink/25"
                          initial={rm ? { opacity: 0 } : { opacity: 0, scaleY: 0 }}
                          animate={rm ? { opacity: 1 } : { opacity: 1, scaleY: 1 }}
                          exit={rm ? { opacity: 0 } : { opacity: 0, scaleY: 0 }}
                          transition={rm ? { duration: 0 } : { duration: 0.22, ease: EASE_OUT }}
                        />
                      )}
                    </AnimatePresence>

                    {/* Date */}
                    <div className="mb-3">
                      <time
                        dateTime={post.date}
                        className="text-[12px] tabular-nums text-ink/35"
                      >
                        {formatDate(post.date)}
                      </time>
                    </div>

                    {/* Title */}
                    <h2
                      className={[
                        'mb-3 text-[22px] font-semibold leading-[1.2] tracking-[-0.018em] transition-colors duration-150',
                        isSelected ? 'text-ink' : 'text-ink/80',
                      ].join(' ')}
                    >
                      {post.title}
                    </h2>

                    {/* Excerpt — fades out when panel opens */}
                    <AnimatePresence>
                      {!isSelected && post.excerpt && (
                        <motion.p
                          className="mb-4 text-[15px] leading-[1.6] tracking-[-0.01em] text-muted/70"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={rm ? { duration: 0 } : { duration: 0.14 }}
                        >
                          {excerpt(post.excerpt)}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    {/* Tags */}
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {post.tags.slice(0, isSelected ? 3 : 4).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-ink/[0.10] px-2.5 py-0.5 text-[11px] text-ink/40"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                </Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Divider ──────────────────────────────────────────────────────── */}
      <div className="hidden lg:block w-px flex-none bg-ink/[0.06]" />

      {/* ── Right column: 45%, independently scrollable ──────────────────── */}
      <div className="hidden lg:flex flex-[9] min-w-0 flex-col overflow-y-auto pl-10 lg:pl-14 pr-6 sm:pr-10 lg:pr-16 pt-16 lg:pt-20 pb-12">
        <AnimatePresence mode="wait">
          {selectedPost ? (
            <WritingDetailPanel
              key={selectedPost.id}
              post={selectedPost}
              onClose={handleClose}
            />
          ) : (
            <motion.div
              key="placeholder"
              className="flex flex-col items-center justify-center rounded-[20px] bg-ink/[0.025] px-8 py-16 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={rm ? { duration: 0 } : { duration: 0.18 }}
            >
              <p className="text-[12px] leading-[1.7] tracking-[0.015em] text-ink/28">
                Select an article<br />to read in depth
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </main>
  );
}
