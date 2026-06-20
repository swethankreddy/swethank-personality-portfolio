'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { EASE_OUT } from '@/lib/motion';

/**
 * Thin client wrapper that adds scroll-triggered fade-up reveal
 * to any project tile (server-rendered content inside, motion on the outside).
 *
 * className is forwarded so the grid layout classes (col-span-2 etc.)
 * can be applied to the wrapper div rather than the inner section.
 */
export default function ProjectReveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const rm = useReducedMotion();

  return (
    <motion.div
      initial={rm ? { opacity: 0 } : { opacity: 0, y: 28 }}
      whileInView={rm ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={rm ? { duration: 0 } : { duration: 0.52, delay, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
