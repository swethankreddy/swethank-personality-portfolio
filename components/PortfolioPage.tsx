'use client';

import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import ConversationLayout from '@/components/ConversationLayout';
import type { WorkspaceCard } from '@/lib/data';

type Mode = 'portfolio' | 'conversation';
type Persona = 'builder' | 'creator';

interface RecentProject {
  id: string;
  title: string;
  year: number;
  link?: string;
}

interface LatestWriting {
  title: string;
  slug: string;
  tags: string[];
}

interface PortfolioPageProps {
  initialPersona: Persona;
  currentStatus: string[];
  recentWork: RecentProject[];
  latestWriting: LatestWriting | null;
  workspaceCards: WorkspaceCard[];
}

export default function PortfolioPage({ initialPersona, currentStatus, recentWork, latestWriting, workspaceCards }: PortfolioPageProps) {
  const [mode, setMode] = useState<Mode>('portfolio');

  const handleChatOpen = useCallback(() => setMode('conversation'), []);
  const handleBack = useCallback(() => setMode('portfolio'), []);

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      {/* Screen-reader live region announces mode changes */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {mode === 'conversation' ? 'Conversation workspace' : 'Portfolio'}
      </div>

      {/* Nav is outside AnimatePresence — it persists across both modes */}
      <Nav mode={mode} onBack={handleBack} />

      {/* Content area: both layouts are absolutely positioned here during transition */}
      <div className="relative flex flex-1 overflow-hidden">
        <AnimatePresence>
          {mode === 'portfolio' && (
            <motion.div
              key="portfolio"
              className="absolute inset-0 overflow-x-hidden"
              /* No self-animation — nested Hero elements handle their own exits */
            >
              <Hero
                initialPersona={initialPersona}
                onChatOpen={handleChatOpen}
                currentStatus={currentStatus}
                recentWork={recentWork}
                latestWriting={latestWriting}
              />
            </motion.div>
          )}

          {mode === 'conversation' && (
            <motion.div
              key="conversation"
              className="absolute inset-0"
              /* No self-animation — nested ConversationLayout elements handle their own enters */
            >
              <ConversationLayout workspaceCards={workspaceCards} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
