'use client';

import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { EASE_EXPO, EASE_OUT } from '@/lib/motion';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const rm = useReducedMotion();

  return (
    <AnimatePresence
      mode="wait"
      initial={false}
      onExitComplete={() => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        delete document.body.dataset.scrollLocked;
        window.scrollTo(0, 0);
      }}
    >
      <motion.div
        key={pathname}
        style={{ position: 'relative', minHeight: '100dvh' }}
        initial={rm ? { opacity: 0 } : { opacity: 0, y: 12 }}
        animate={
          rm
            ? { opacity: 1 }
            : {
                opacity: 1,
                y: 0,
                transition: { duration: 0.26, ease: EASE_EXPO },
              }
        }
        exit={
          rm
            ? { opacity: 0 }
            : {
                opacity: 0,
                y: -6,
                transition: { duration: 0.11, ease: EASE_OUT },
              }
        }
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
