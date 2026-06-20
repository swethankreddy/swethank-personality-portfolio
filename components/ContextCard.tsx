'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { WorkspaceCard } from '@/lib/data';
import { SPRING_SNAP } from '@/lib/motion';

interface ContextCardProps {
  card: WorkspaceCard;
  selected?: boolean;
  referenced?: boolean;
  onClick?: () => void;
}

export default function ContextCard({ card, selected, referenced, onClick }: ContextCardProps) {
  const rm = useReducedMotion();
  const cardRef = useRef<HTMLButtonElement>(null);
  const wasReferenced = useRef(false);

  // On false → true transition: scroll into view so the user sees the update.
  useEffect(() => {
    if (referenced && !wasReferenced.current && !rm) {
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    wasReferenced.current = referenced ?? false;
  }, [referenced, rm]);

  return (
    <motion.button
      ref={cardRef as React.RefObject<HTMLButtonElement>}
      type="button"
      onClick={onClick}
      className={[
        'group relative w-full text-left rounded-[18px] overflow-hidden transition-shadow duration-200',
        selected
          ? 'shadow-[0_0_0_2px_rgba(0,0,0,0.22),0_2px_8px_rgba(0,0,0,0.10)]'
          : referenced
            ? 'shadow-[0_0_0_1.5px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.08)]'
            : 'shadow-[0_1px_3px_rgba(0,0,0,0.07),0_0_0_1px_rgba(0,0,0,0.05)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.10),0_0_0_1px_rgba(0,0,0,0.09)]',
      ].join(' ')}
      whileTap={rm ? {} : { scale: 0.98 }}
      transition={SPRING_SNAP}
      aria-pressed={selected}
    >
      {/* Ring overlay — animates in when this card becomes referenced, fades on exit.
          Stays visible for the duration the card is referenced (current AI turn only). */}
      <AnimatePresence>
        {referenced && !selected && (
          <motion.span
            key="ref-ring"
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[18px]"
            style={{ boxShadow: '0 0 0 1.5px rgba(0,0,0,0.18) inset' }}
            initial={rm ? { opacity: 0 } : { opacity: 0, scale: 0.93 }}
            animate={rm ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={rm ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
            transition={rm ? { duration: 0 } : { duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
      </AnimatePresence>

      {/* Thumbnail */}
      <div className="w-full h-[72px] bg-ink/[0.08]" />

      {/* Card content */}
      <div className="px-3.5 pt-3 pb-3.5">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink/32">
            {card.label}
          </span>
          <div className="flex items-center gap-2">
            {card.github && (
              <a
                href={card.github}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                aria-label="View on GitHub"
                className="rounded p-0.5 text-ink/25 opacity-0 scale-90 transition-[opacity,transform,color] duration-150 ease-out group-hover:opacity-100 group-hover:scale-100 hover:text-ink/55"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.745 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
            )}
            <AnimatePresence>
              {referenced && !selected && (
                <motion.span
                  key="ref-dot"
                  className="h-1.5 w-1.5 rounded-full bg-ink/30"
                  aria-label="Referenced in conversation"
                  initial={rm ? { opacity: 0 } : { opacity: 0, scale: 0 }}
                  animate={rm ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                  exit={rm ? { opacity: 0 } : { opacity: 0, scale: 0 }}
                  transition={rm ? { duration: 0 } : { duration: 0.2, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                />
              )}
            </AnimatePresence>
            <span className="tabular-nums text-[11px] text-ink/28">{card.year}</span>
          </div>
        </div>

        <p className="mb-2 line-clamp-2 text-[13px] font-semibold leading-[1.38] tracking-[-0.014em] text-ink/85">
          {card.title}
        </p>

        <p className="text-[11px] tracking-[0.005em] text-ink/38">
          {card.tags.slice(0, 3).join(' · ')}
        </p>
      </div>
    </motion.button>
  );
}
