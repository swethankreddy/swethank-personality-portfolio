'use client';

import { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Markdown from 'react-markdown';
import { EASE_EXPO, EASE_OUT } from '@/lib/motion';
import type { ProjectDetail } from '@/lib/data';

// Same Apple system colors as the list
const STATUS_CONFIG: Record<string, { label: string; dot: string | null }> = {
  active:    { label: 'Active Research', dot: '#34c759' },
  completed: { label: 'Completed',       dot: null },
  wip:       { label: 'In Progress',     dot: '#ff9500' },
};

function getStatus(status: string) {
  return STATUS_CONFIG[status] ?? { label: status, dot: null };
}

// Typography scaled for the wider 45% panel column
const mdComponents: React.ComponentProps<typeof Markdown>['components'] = {
  p: ({ children }) => (
    <p className="mb-3 last:mb-0 text-[14px] leading-[1.7] tracking-[-0.01em] text-ink/55">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-ink/72">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
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
};

function DetailSection({ label, content }: { label: string; content: string }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.12em] text-ink/28">
        {label}
      </p>
      <Markdown components={mdComponents}>{content}</Markdown>
    </div>
  );
}

interface Project {
  id: string;
  title: string;
  description: string;
  year: number;
  tags: string[];
  link: string;
  github?: string;
  status: string;
  workspaceId?: string;
  detail?: ProjectDetail;
}

export default function ProjectDetailPanel({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const rm = useReducedMotion();
  const { label, dot } = getStatus(project.status);
  const d = project.detail;

  const hasDetail =
    d && (d.overview || d.implementation || d.challenges || d.results || d.techStack);

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
        {project.title}
      </motion.h2>

      {/* Status dot + label · year */}
      <div className="mb-6 flex items-center gap-2">
        {dot && (
          <span
            aria-hidden="true"
            className="inline-block h-[6px] w-[6px] flex-none rounded-full"
            style={{ backgroundColor: dot }}
          />
        )}
        <span className="text-[12px] text-ink/40">{label}</span>
        <span className="text-[11px] text-ink/22">·</span>
        <span className="text-[12px] tabular-nums text-ink/35">{project.year}</span>
      </div>

      {/* Hairline divider */}
      <div className="mb-5 h-px bg-ink/[0.07]" />

      {/* Detail sections or description fallback */}
      <motion.div
        className="space-y-6"
        initial={rm ? { opacity: 0 } : { opacity: 0, y: 5 }}
        animate={rm ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={rm ? { duration: 0 } : { duration: 0.3, delay: 0.09, ease: EASE_OUT }}
      >
        {hasDetail ? (
          <>
            {d!.overview && (
              <DetailSection label="Overview" content={d!.overview} />
            )}
            {d!.implementation && (
              <DetailSection label="Technical Implementation" content={d!.implementation} />
            )}
            {d!.challenges && (
              <DetailSection label="Challenges" content={d!.challenges} />
            )}
            {d!.results && (
              <DetailSection label="Results & Impact" content={d!.results} />
            )}
            {d!.techStack && (
              <DetailSection label="Tech Stack" content={d!.techStack} />
            )}
          </>
        ) : (
          <p className="text-[14px] leading-[1.7] tracking-[-0.01em] text-ink/55">
            {project.description}
          </p>
        )}
      </motion.div>

      {/* Tag chips */}
      {project.tags.length > 0 && (
        <motion.div
          className="mt-6 flex flex-wrap gap-2"
          initial={rm ? { opacity: 0 } : { opacity: 0 }}
          animate={rm ? { opacity: 1 } : { opacity: 1 }}
          transition={rm ? { duration: 0 } : { duration: 0.22, delay: 0.17, ease: EASE_OUT }}
        >
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-ink/[0.05] px-3 py-1 text-[12px] tracking-[0.005em] text-ink/45"
            >
              {tag}
            </span>
          ))}
        </motion.div>
      )}

      {/* External links */}
      {(project.github || project.link) && (
        <motion.div
          className="mt-6 flex items-center gap-4 pb-4"
          initial={rm ? { opacity: 0 } : { opacity: 0 }}
          animate={rm ? { opacity: 1 } : { opacity: 1 }}
          transition={rm ? { duration: 0 } : { duration: 0.18, delay: 0.21, ease: EASE_OUT }}
        >
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[13px] text-ink/38 transition-colors duration-150 hover:text-ink"
            >
              GitHub ↗
            </a>
          )}
          {project.link && project.link !== project.github && (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[13px] text-ink/38 transition-colors duration-150 hover:text-ink"
            >
              View project ↗
            </a>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
