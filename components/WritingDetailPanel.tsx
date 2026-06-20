'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import Markdown from 'react-markdown';
import { EASE_EXPO, EASE_OUT } from '@/lib/motion';

interface WritingPost {
  id: string;
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  tags: string[];
}

const md: React.ComponentProps<typeof Markdown>['components'] = {
  p: ({ children }) => (
    <p className="mb-3 last:mb-0 text-[14px] leading-[1.7] tracking-[-0.01em] text-ink/55">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-ink/72">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  h2: ({ children }) => (
    <h2 className="mb-2 mt-5 text-[15px] font-semibold leading-[1.3] tracking-[-0.015em] text-ink/75">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-4 text-[14px] font-semibold leading-[1.3] tracking-[-0.01em] text-ink/65">
      {children}
    </h3>
  ),
  ul: ({ children }) => <ul className="my-3 space-y-2 list-none">{children}</ul>,
  li: ({ children }) => (
    <li className="flex gap-2.5 text-[14px] leading-[1.65] tracking-[-0.01em] text-ink/55">
      <span className="mt-[0.55em] h-[5px] w-[5px] flex-none rounded-full bg-ink/[0.18]" />
      <span>{children}</span>
    </li>
  ),
  code: ({ children }) => (
    <code className="rounded bg-ink/[0.06] px-1 py-0.5 font-mono text-[12px] text-ink/60">
      {children}
    </code>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-ink/[0.12] pl-4 text-[14px] italic leading-[1.7] text-ink/45">
      {children}
    </blockquote>
  ),
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function WritingDetailPanel({
  post,
  onClose,
}: {
  post: WritingPost;
  onClose: () => void;
}) {
  const rm = useReducedMotion();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const body = post.content?.trim() || post.excerpt;

  return (
    <motion.div
      className="flex flex-col"
      initial={rm ? { opacity: 0 } : { opacity: 0, x: 16 }}
      animate={rm ? { opacity: 1 } : { opacity: 1, x: 0 }}
      exit={rm ? { opacity: 0 } : { opacity: 0, x: 16 }}
      transition={rm ? { duration: 0 } : { duration: 0.28, ease: EASE_EXPO }}
    >
      {/* Close button */}
      <div className="mb-5 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="text-[20px] leading-none text-ink/22 transition-colors duration-150 hover:text-ink/50"
          aria-label="Close detail panel"
        >
          ×
        </button>
      </div>

      {/* Title */}
      <motion.h2
        className="mb-3 text-[20px] font-semibold leading-[1.28] tracking-[-0.02em] text-ink/90"
        initial={rm ? { opacity: 0 } : { opacity: 0, y: 5 }}
        animate={rm ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={rm ? { duration: 0 } : { duration: 0.26, delay: 0.04, ease: EASE_OUT }}
      >
        {post.title}
      </motion.h2>

      {/* Date */}
      <div className="mb-6">
        <time
          dateTime={post.date}
          className="text-[12px] tabular-nums text-ink/40"
        >
          {formatDate(post.date)}
        </time>
      </div>

      {/* Hairline */}
      <div className="mb-5 h-px bg-ink/[0.07]" />

      {/* Body */}
      <motion.div
        initial={rm ? { opacity: 0 } : { opacity: 0, y: 5 }}
        animate={rm ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={rm ? { duration: 0 } : { duration: 0.3, delay: 0.09, ease: EASE_OUT }}
      >
        {body ? (
          <Markdown components={md}>{body}</Markdown>
        ) : (
          <p className="text-[14px] leading-[1.7] tracking-[-0.01em] text-ink/55">
            No content yet.
          </p>
        )}
      </motion.div>

      {/* Tags */}
      {post.tags.length > 0 && (
        <motion.div
          className="mt-6 flex flex-wrap gap-2"
          initial={rm ? { opacity: 0 } : { opacity: 0 }}
          animate={rm ? { opacity: 1 } : { opacity: 1 }}
          transition={rm ? { duration: 0 } : { duration: 0.22, delay: 0.17, ease: EASE_OUT }}
        >
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-ink/[0.05] px-3 py-1 text-[12px] tracking-[0.005em] text-ink/45"
            >
              {tag}
            </span>
          ))}
        </motion.div>
      )}

      {/* Read full article link */}
      <motion.div
        className="mt-6 pb-4"
        initial={rm ? { opacity: 0 } : { opacity: 0 }}
        animate={rm ? { opacity: 1 } : { opacity: 1 }}
        transition={rm ? { duration: 0 } : { duration: 0.18, delay: 0.21, ease: EASE_OUT }}
      >
        <Link
          href={`/writing/${post.slug}`}
          className="inline-flex items-center gap-1.5 text-[13px] text-ink/38 transition-colors duration-150 hover:text-ink"
        >
          Read full article →
        </Link>
      </motion.div>
    </motion.div>
  );
}
