'use client';

import { Suspense, useCallback, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import ContextPanel from '@/components/ContextPanel';
import CardDetail from '@/components/CardDetail';
import ChatSection from '@/components/ChatSection';
import { EASE_OUT, SPRING_SNAP } from '@/lib/motion';
import { SOCIAL_LINKS } from '@/lib/social';
import type { WorkspaceCard } from '@/lib/data';

function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.745 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
      <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
    </svg>
  );
}

const SOCIAL_ICONS = {
  github: GithubIcon,
  linkedin: LinkedInIcon,
  email: MailIcon,
} as const;

export default function ConversationLayout({ workspaceCards }: { workspaceCards: WorkspaceCard[] }) {
  const rm = useReducedMotion();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [referencedIds, setReferencedIds] = useState<string[]>([]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const handleClose = useCallback(() => setSelectedId(null), []);

  const selectedCard = workspaceCards.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="flex h-full bg-surface overflow-hidden gap-8 px-8 lg:px-10 xl:px-14">
      {/* Left: Context cards */}
      <ContextPanel
        cards={workspaceCards}
        selectedId={selectedId}
        onSelect={handleSelect}
        referencedIds={referencedIds}
      />

      {/* Center: Chat — grows between the two flanking columns */}
      <motion.div
        className="flex flex-1 flex-col overflow-hidden min-w-0"
        initial={rm ? { opacity: 0 } : { opacity: 0, y: 10 }}
        animate={rm ? { opacity: 1 } : { opacity: 1, y: 0 }}
        exit={rm ? { opacity: 0 } : { opacity: 0, y: 8 }}
        transition={rm ? { duration: 0 } : { duration: 0.38, delay: 0.06, ease: EASE_OUT }}
      >
        <Suspense fallback={null}>
          <ChatSection
            mode="workspace"
            onReferencedIdsChange={setReferencedIds}
          />
        </Suspense>
      </motion.div>

      {/* Right: Detail panel — always occupies column space to keep chat centered */}
      <div className="hidden lg:flex lg:w-[256px] xl:w-[272px] flex-none flex-col py-8 pl-1">
        <AnimatePresence mode="wait">
          {selectedCard ? (
            <CardDetail
              key={selectedCard.id}
              card={selectedCard}
              onClose={handleClose}
            />
          ) : (
            <motion.div
              key="placeholder"
              className="w-full rounded-[18px] bg-ink/[0.05] aspect-[4/5]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={rm ? { duration: 0 } : { duration: 0.2 }}
            />
          )}
        </AnimatePresence>

        {/* Social links — bottom of right column, hidden on mobile with parent */}
        <div className="mt-auto flex items-center gap-[18px] pt-6">
          {SOCIAL_LINKS.map(({ id, label, href, external }) => {
            const Icon = SOCIAL_ICONS[id as keyof typeof SOCIAL_ICONS];
            if (!Icon) return null;
            return (
              <motion.a
                key={id}
                href={href}
                aria-label={label}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="text-ink/28 transition-[color,opacity] duration-200 hover:text-ink/60"
                whileHover={rm ? undefined : { y: -1.5 }}
                whileTap={rm ? undefined : { scale: 0.88 }}
                transition={SPRING_SNAP}
              >
                <Icon />
              </motion.a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
