'use client';

import { motion, useReducedMotion } from 'framer-motion';
import ContextCard from '@/components/ContextCard';
import { EASE_EXPO, EASE_OUT } from '@/lib/motion';
import type { WorkspaceCard } from '@/lib/data';

interface ContextPanelProps {
  cards: WorkspaceCard[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  referencedIds?: string[];
}

export default function ContextPanel({ cards, selectedId, onSelect, referencedIds = [] }: ContextPanelProps) {
  const rm = useReducedMotion();

  return (
    <motion.aside
      className="hidden lg:flex lg:w-[256px] xl:w-[272px] flex-none flex-col py-8 overflow-y-auto scroll-fade"
      aria-label="Conversation context"
      role="complementary"
      initial={rm ? { opacity: 0 } : { opacity: 0, x: -12 }}
      animate={rm ? { opacity: 1 } : { opacity: 1, x: 0 }}
      exit={rm ? { opacity: 0 } : { opacity: 0, x: -12 }}
      transition={rm ? { duration: 0 } : { duration: 0.44, ease: EASE_EXPO }}
    >
      <motion.div
        className="space-y-3 px-1"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: rm ? 0 : 0.07,
              delayChildren: rm ? 0 : 0.22,
            },
          },
        }}
      >
        {cards.map((card) => (
          <motion.div
            key={card.id}
            variants={{
              hidden: { opacity: 0, y: rm ? 0 : 6 },
              visible: {
                opacity: 1,
                y: 0,
                transition: rm ? { duration: 0 } : { duration: 0.28, ease: EASE_OUT },
              },
            }}
          >
            <ContextCard
              card={card}
              selected={selectedId === card.id}
              referenced={referencedIds.includes(card.id)}
              onClick={() => onSelect(card.id)}
            />
          </motion.div>
        ))}
      </motion.div>
    </motion.aside>
  );
}
