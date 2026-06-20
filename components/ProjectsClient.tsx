'use client';

import { Fragment, useCallback, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { EASE_OUT } from '@/lib/motion';
import ProjectDetailPanel from '@/components/ProjectDetailPanel';
import type { Project } from '@/lib/data';

// Apple system palette — green for live/active, orange for in-progress
const STATUS_CONFIG: Record<string, { label: string; dot: string | null }> = {
  active:    { label: 'Active Research', dot: '#34c759' },
  completed: { label: 'Completed',       dot: null },
  wip:       { label: 'In Progress',     dot: '#ff9500' },
};

function getStatus(status: string) {
  return STATUS_CONFIG[status] ?? { label: status, dot: null };
}

function excerpt(text: string, max = 130): string {
  if (text.length <= max) return text;
  return text.slice(0, text.lastIndexOf(' ', max)) + '…';
}

function GitHubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.745 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export default function ProjectsClient({ projects }: { projects: Project[] }) {
  const rm = useReducedMotion();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedProject = projects.find((p) => p.id === selectedId) ?? null;

  const handleSelect = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const handleClose = useCallback(() => setSelectedId(null), []);

  return (
    <main className="flex flex-1 overflow-hidden">

      {/* ── Left column: 55% ─────────────────────────────────────────────── */}
      <div className="flex-[11] min-w-0 overflow-y-auto pl-6 sm:pl-10 lg:pl-16 pr-6 lg:pr-14 py-16 lg:py-20">

        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted/50">
          Projects
        </p>
        <h1 className="mb-12 text-[32px] font-bold leading-[1.1] tracking-[-0.02em] text-ink">
          Work &amp; Research
        </h1>

        {projects.length === 0 ? (
          <p className="text-[17px] leading-[1.6] text-muted/60">Nothing published yet.</p>
        ) : (
          <div>
            {projects.map((project, i) => {
              const isSelected = selectedId === project.id;
              const { label, dot } = getStatus(project.status);

              return (
                <Fragment key={project.id}>
                  {i > 0 && <div className="h-px bg-ink/[0.07]" />}

                  <article
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelect(project.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelect(project.id);
                      }
                    }}
                    className={[
                      'group relative -mx-3 cursor-pointer rounded-xl px-3 py-9 outline-none',
                      'transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ink/20',
                      isSelected ? 'bg-ink/[0.04]' : 'hover:bg-ink/[0.025]',
                    ].join(' ')}
                  >
                    {/* Left bar — active indicator */}
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

                    {/* Metadata: year · status dot + label [· GitHub icon on hover] */}
                    <div className="mb-3 flex items-center gap-3">
                      <span className="text-[12px] tabular-nums text-ink/35">
                        {project.year}
                      </span>
                      <span className="text-[10px] text-ink/20">·</span>
                      <div className="flex items-center gap-1.5">
                        {dot && (
                          <span
                            aria-hidden="true"
                            className="inline-block h-[6px] w-[6px] flex-none rounded-full"
                            style={{ backgroundColor: dot }}
                          />
                        )}
                        <span className="text-[12px] text-ink/40">{label}</span>
                      </div>
                      {project.github && (
                        <a
                          href={project.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          aria-label="View on GitHub"
                          className="ml-auto -mr-0.5 rounded p-1 text-ink/25 opacity-0 scale-90 transition-[opacity,transform,color] duration-150 ease-out group-hover:opacity-100 group-hover:scale-100 hover:text-ink/60"
                        >
                          <GitHubIcon />
                        </a>
                      )}
                    </div>

                    {/* Title */}
                    <h2
                      className={[
                        'mb-3 text-[22px] font-semibold leading-[1.2] tracking-[-0.018em] transition-colors duration-150',
                        isSelected ? 'text-ink' : 'text-ink/80',
                      ].join(' ')}
                    >
                      {project.title}
                    </h2>

                    {/* Description — fades out when panel opens */}
                    <AnimatePresence>
                      {!isSelected && project.description && (
                        <motion.p
                          className="mb-4 text-[15px] leading-[1.6] tracking-[-0.01em] text-muted/70"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={rm ? { duration: 0 } : { duration: 0.14 }}
                        >
                          {excerpt(project.description)}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    {/* Tags */}
                    {project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {project.tags.slice(0, isSelected ? 3 : 4).map((tag) => (
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
          {selectedProject ? (
            <ProjectDetailPanel
              key={selectedProject.id}
              project={selectedProject}
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
                Select a project<br />to explore in depth
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </main>
  );
}
