'use client';

import { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { WorkspaceCard } from '@/lib/data';
import { EASE_EXPO, EASE_OUT } from '@/lib/motion';

interface CardDetailProps {
  card: WorkspaceCard;
  onClose: () => void;
}

export default function CardDetail({ card, onClose }: CardDetailProps) {
  const rm = useReducedMotion();

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      className="flex flex-col"
      initial={rm ? { opacity: 0 } : { opacity: 0, x: 10 }}
      animate={rm ? { opacity: 1 } : { opacity: 1, x: 0 }}
      exit={rm ? { opacity: 0 } : { opacity: 0, x: 10 }}
      transition={rm ? { duration: 0 } : { duration: 0.28, ease: EASE_EXPO }}
    >
      {/* Thumbnail — matches card style */}
      <div className="w-full aspect-video rounded-[18px] bg-ink/[0.08] mb-4" />

      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink/32">
          {card.label}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 -mt-0.5 text-[18px] leading-none text-ink/25 hover:text-ink/55 transition-colors duration-150"
          aria-label="Close detail panel"
        >
          ×
        </button>
      </div>

      {/* Title */}
      <h2 className="text-[15px] font-semibold leading-[1.35] tracking-[-0.016em] text-ink/90 mb-3">
        {card.title}
      </h2>

      {/* Status + year */}
      <p className="mb-3 text-[11px] tracking-[0.01em] text-ink/35">
        {card.status} · {card.year}
      </p>

      {/* Description */}
      <motion.p
        className="text-[13px] leading-[1.7] tracking-[-0.009em] text-ink/58 mb-4"
        initial={rm ? { opacity: 0 } : { opacity: 0, y: 4 }}
        animate={rm ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={rm ? { duration: 0 } : { duration: 0.3, delay: 0.08, ease: EASE_OUT }}
      >
        {card.description}
      </motion.p>

      {/* Tags */}
      <motion.div
        className="flex flex-wrap gap-1.5"
        initial={rm ? { opacity: 0 } : { opacity: 0 }}
        animate={rm ? { opacity: 1 } : { opacity: 1 }}
        transition={rm ? { duration: 0 } : { duration: 0.25, delay: 0.14, ease: EASE_OUT }}
      >
        {card.tags.map((tag) => (
          <span
            key={tag}
            className="text-[11px] px-2.5 py-[5px] rounded-full bg-ink/[0.05] text-ink/45 tracking-[0.005em]"
          >
            {tag}
          </span>
        ))}
      </motion.div>
    </motion.div>
  );
}
