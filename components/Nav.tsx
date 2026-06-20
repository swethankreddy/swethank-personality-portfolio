'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { EASE_OUT } from '@/lib/motion';

type Mode = 'portfolio' | 'conversation';

interface NavProps {
  mode?: Mode;
  onBack?: () => void;
}

const NAV_LINKS = [
  { href: '/projects', label: 'Projects' },
  { href: '/writing', label: 'Writing' },
  { href: '/about', label: 'About' },
] as const;

function lockScroll() {
  const scrollY = window.scrollY;
  if (scrollY > 0) {
    const bodyW = document.body.clientWidth;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = `${bodyW}px`;
    document.body.dataset.scrollLocked = String(scrollY);
  }
}

export default function Nav({ mode = 'portfolio', onBack }: NavProps) {
  const prefersReducedMotion = useReducedMotion();
  const rm = prefersReducedMotion;
  const isConversation = mode === 'conversation';
  const pathname = usePathname();

  return (
    <header
      className="flex h-16 shrink-0 items-center justify-between px-6 sm:px-10 lg:px-16"
    >
      {/* Left side: back link + wordmark */}
      <div className="flex items-center gap-3">
        {/* Back affordance — conversation mode only */}
        <AnimatePresence>
          {isConversation && (
            <motion.button
              type="button"
              onClick={onBack}
              className="text-[13px] text-muted transition-colors duration-150 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 rounded"
              aria-label="Return to portfolio"
              initial={rm ? { opacity: 0 } : { opacity: 0, x: -8 }}
              animate={rm ? { opacity: 1 } : { opacity: 1, x: 0 }}
              exit={rm ? { opacity: 0 } : { opacity: 0, x: -8 }}
              transition={rm ? { duration: 0 } : { duration: 0.2, ease: EASE_OUT }}
            >
              ← Portfolio
            </motion.button>
          )}
        </AnimatePresence>

        {/* Wordmark — link in portfolio, button in conversation */}
        {isConversation ? (
          <button
            type="button"
            onClick={onBack}
            className="text-[15px] font-bold tracking-[-0.01em] text-ink transition-opacity duration-150 hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 rounded"
            aria-label="Return to portfolio"
          >
            Swethank.
          </button>
        ) : (
          <Link
            href="/"
            scroll={false}
            onClick={lockScroll}
            className="text-[15px] font-bold tracking-[-0.01em] text-ink transition-opacity duration-150 hover:opacity-60"
            aria-label="Swethank, Home"
          >
            Swethank.
          </Link>
        )}
      </div>

      {/* Right side: nav links — portfolio mode only */}
      <AnimatePresence>
        {!isConversation && (
          <motion.nav
            aria-label="Main navigation"
            initial={rm ? { opacity: 0 } : { opacity: 0, x: 8 }}
            animate={rm ? { opacity: 1 } : { opacity: 1, x: 0 }}
            exit={rm ? { opacity: 0 } : { opacity: 0, x: 8 }}
            transition={rm ? { duration: 0 } : { duration: 0.2, ease: EASE_OUT }}
          >
            <ul className="group/nav flex items-center gap-8" role="list">
              {NAV_LINKS.map(({ href, label }) => {
                const isActive = pathname === href;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      scroll={false}
                      onClick={lockScroll}
                      aria-current={isActive ? 'page' : undefined}
                      className={[
                        'text-sm transition-[opacity,color] duration-150',
                        isActive
                          ? 'text-ink'
                          : 'text-muted group-hover/nav:opacity-40 hover:!opacity-100 hover:text-ink',
                      ].join(' ')}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
