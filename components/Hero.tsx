'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { EASE_OUT, EASE_EXPO, SPRING_SNAP } from '@/lib/motion';
import { SOCIAL_LINKS } from '@/lib/social';

type Persona = 'builder' | 'creator';

const CONTENT = {
  builder: {
    headlineLines: ['AI.', 'Products.', 'Systems.'],
    headlineTracking: 'tracking-[-0.02em]',
    subtext:
      'IIT Bombay. Research systems and AI products. Built to be understood, not just to function.',
    tags: ['IIT Bombay', 'AI', 'Product', 'Research'],
    portrait: {
      src: '/reference/builder-portrait.png',
      alt: 'Swethank, Builder portrait',
    },
  },
  creator: {
    headlineLines: ['Motion.', 'Frame.', 'Craft.'],
    headlineTracking: 'tracking-[0]',
    subtext:
      'IIT Bombay. Motion design, video editing, and graphic work. Every frame composed, every cut considered.',
    tags: ['IIT Bombay', 'Motion', 'Video', 'Graphics'],
    portrait: {
      src: '/reference/creator-portrait.png',
      alt: 'Swethank, Creator portrait',
    },
  },
} as const;

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

function TagRow({ tags }: { tags: readonly string[] }) {
  return (
    <div
      className="flex flex-wrap items-center gap-y-1 text-[13px] tracking-[0.04em] text-muted"
      aria-label="Tags"
    >
      {tags.map((tag, i) => (
        <span key={tag} className="flex items-center">
          {i > 0 && (
            <span className="mx-2 select-none" aria-hidden="true">·</span>
          )}
          {tag}
        </span>
      ))}
    </div>
  );
}

function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.745 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
      <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
    </svg>
  );
}

const SOCIAL_ICONS = {
  github: GithubIcon,
  linkedin: LinkedInIcon,
  email: MailIcon,
};

function SocialLinks({ rm }: { rm: boolean | null }) {
  return (
    <div className="mt-7 hidden sm:flex items-center gap-5">
      {SOCIAL_LINKS.map(({ id, label, href, external }) => {
        const Icon = SOCIAL_ICONS[id as keyof typeof SOCIAL_ICONS];
        return (
          <motion.a
            key={id}
            href={href}
            aria-label={label}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="text-ink/35 transition-colors duration-150 hover:text-ink/70"
            whileHover={rm ? undefined : { y: -2 }}
            whileTap={rm ? undefined : { scale: 0.9 }}
            transition={SPRING_SNAP}
          >
            <Icon />
          </motion.a>
        );
      })}
    </div>
  );
}

const MotionLink = motion(Link);

function CTAGroup({ onChatOpen }: { onChatOpen: () => void }) {
  const prefersReducedMotion = useReducedMotion();
  const tapProps = prefersReducedMotion
    ? {}
    : { whileHover: { y: -2 }, whileTap: { scale: 0.97 }, transition: SPRING_SNAP };

  const base =
    'inline-flex h-11 items-center justify-center rounded-full px-6 text-[15px] font-medium transition-colors duration-150';
  return (
    <div className="flex flex-wrap gap-3">
      <motion.button
        type="button"
        onClick={onChatOpen}
        className={`${base} bg-ink text-surface hover:bg-ink/90`}
        {...tapProps}
      >
        Talk with Swethank ↓
      </motion.button>
      <MotionLink
        href="/resume.pdf"
        className={`${base} border border-ink/25 text-ink hover:border-ink/40 hover:bg-ink/[0.04]`}
        {...tapProps}
      >
        Resume
      </MotionLink>
    </div>
  );
}

interface HeroProps {
  initialPersona?: Persona;
  onChatOpen: () => void;
  currentStatus: string[];
  recentWork: RecentProject[];
  latestWriting: LatestWriting | null;
}

export default function Hero({ initialPersona = 'builder', onChatOpen, currentStatus, recentWork, latestWriting }: HeroProps) {
  const [persona, setPersona] = useState<Persona>(initialPersona);
  const content = CONTENT[persona];
  const prefersReducedMotion = useReducedMotion();
  const rm = prefersReducedMotion;

  useEffect(() => {
    document.documentElement.dataset.persona = persona;
  }, [persona]);

  function switchPersona(next: Persona) {
    if (next === persona) return;
    setPersona(next);
    window.history.replaceState(null, '', `?persona=${next}`);
  }

  const contentVariants = {
    enter: rm ? { opacity: 0 } : { opacity: 0, y: 8 },
    center: {
      opacity: 1,
      ...(rm ? {} : { y: 0 }),
      transition: rm ? { duration: 0 } : { duration: 0.28, ease: EASE_OUT },
    },
    exit: {
      opacity: 0,
      ...(rm ? {} : { y: -5 }),
      transition: rm ? { duration: 0 } : { duration: 0.18, ease: EASE_OUT },
    },
  };

  return (
    /* h-full fills the absolute container provided by PortfolioPage */
    <div className="flex h-full flex-col overflow-x-hidden bg-surface">
      <main className="flex flex-1 flex-col lg:flex-row">

        {/* ── Mobile portrait ── */}
        <motion.div
          className="relative h-72 overflow-hidden sm:h-80 lg:hidden"
          aria-hidden="true"
          exit={rm ? { opacity: 0 } : { opacity: 0, y: -16, transition: { duration: 0.3, ease: EASE_OUT } }}
        >
          {(['builder', 'creator'] as const).map((p) => (
            <motion.div
              key={p}
              className="absolute inset-0"
              initial={false}
              animate={{ opacity: p === persona ? 1 : 0 }}
              transition={rm ? { duration: 0 } : { duration: 0.4 }}
            >
              <Image
                src={CONTENT[p].portrait.src}
                alt=""
                fill
                className="object-contain object-top"
                priority={p === 'builder'}
                sizes="100vw"
              />
            </motion.div>
          ))}
        </motion.div>

        {/* ── Left column — Identity ── */}
        <motion.section
          className="flex flex-1 flex-col justify-center px-6 py-8 sm:px-10 sm:py-10 lg:flex-none lg:w-[540px] lg:px-16 lg:py-10"
          aria-label="Introduction"
          initial={rm ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={rm ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={rm ? { opacity: 0 } : { opacity: 0, x: '-8%', transition: { duration: 0.4, ease: EASE_EXPO } }}
          transition={rm ? { duration: 0 } : { duration: 0.48, delay: 0.06, ease: EASE_OUT }}
        >
          {/* Persona toggle */}
          <div
            className="mb-8 flex overflow-hidden rounded-xl border border-ink/[0.13]"
            role="group"
            aria-label="Persona mode"
          >
            {(['builder', 'creator'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => switchPersona(p)}
                className="relative flex-1 py-[15px] text-[11px] font-medium uppercase tracking-[0.12em]"
                aria-pressed={persona === p}
              >
                {persona === p && (
                  <motion.span
                    layoutId="toggle-bg"
                    className="absolute inset-0 bg-ink"
                    initial={false}
                    transition={
                      rm
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 420, damping: 36 }
                    }
                  />
                )}
                <span
                  className={`relative z-10 transition-colors duration-200 ${
                    persona === p ? 'text-surface' : 'text-muted hover:text-ink'
                  }`}
                >
                  {p === 'builder' ? 'Builder.' : 'Creator.'}
                </span>
              </button>
            ))}
          </div>

          {/* Static greeting */}
          <p className="mb-3 text-xl font-semibold leading-[1.4] text-ink">
            Hi, I&apos;m Swethank.
          </p>

          {/* Dynamic content block */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={persona}
              variants={contentVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <h1 className={`mb-5 text-display font-bold text-ink ${content.headlineTracking}`}>
                {content.headlineLines.map((line) => (
                  <span key={line} className="block">{line}</span>
                ))}
              </h1>

              <p className="mb-5 max-w-[300px] text-[17px] leading-[1.47] tracking-[-0.022em] text-muted">
                {content.subtext}
              </p>

              <div className="mb-8">
                <TagRow tags={content.tags} />
              </div>

              <CTAGroup onChatOpen={onChatOpen} />
              <SocialLinks rm={rm} />
            </motion.div>
          </AnimatePresence>
        </motion.section>

        {/* ── Center column — Currently / Writing / Projects (xl+) ── */}
        <motion.div
          className="hidden xl:flex xl:flex-none xl:w-[300px] flex-col justify-center py-10 px-8"
          aria-label="Current work, writing and projects"
          initial={rm ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={rm ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={rm ? { opacity: 0 } : { opacity: 0, y: -12, transition: { duration: 0.28, ease: EASE_OUT } }}
          transition={rm ? { duration: 0 } : { duration: 0.48, delay: 0.12, ease: EASE_OUT }}
        >
          <div className="w-full">

            {/* Currently */}
            <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.16em] text-ink/50">
              Currently
            </p>
            <div className="space-y-[16px]">
              {currentStatus.map((sentence, i) => (
                <p
                  key={i}
                  className="text-[17px] leading-[1.5] tracking-[-0.022em] text-ink"
                >
                  {sentence}
                </p>
              ))}
            </div>

            {/* Hairline */}
            <div className="my-6 h-px bg-ink/[0.06]" />

            {/* Writing */}
            <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.16em] text-ink/50">
              Writing
            </p>
            {latestWriting ? (
              <>
                <Link
                  href={`/writing/${latestWriting.slug}`}
                  className="group mb-1.5 flex items-baseline gap-1.5"
                >
                  <span className="text-[15px] font-medium leading-[1.4] tracking-[-0.016em] text-ink/85 transition-colors duration-150 group-hover:text-ink">
                    {latestWriting.title}
                  </span>
                  <span className="shrink-0 text-[13px] text-ink/30 transition-[transform,color] duration-150 group-hover:translate-x-[3px] group-hover:text-ink/60">
                    →
                  </span>
                </Link>
                {latestWriting.tags.filter((t) => t.toLowerCase() !== 'swethank').length > 0 && (
                  <p className="mb-3 text-[11px] leading-[1.5] tracking-[0.04em] text-ink/45">
                    {latestWriting.tags
                      .filter((t) => t.toLowerCase() !== 'swethank')
                      .slice(0, 3)
                      .join(' · ')}
                  </p>
                )}
              </>
            ) : (
              <p className="mb-3 text-[13px] text-ink/45">No articles published yet.</p>
            )}
            <Link
              href="/writing"
              className="group inline-flex items-center gap-0.5 text-[12px] text-gold transition-opacity duration-150 hover:opacity-75"
            >
              View all writing
              <span className="transition-transform duration-150 group-hover:translate-x-[3px]">→</span>
            </Link>

            {/* Hairline */}
            <div className="my-5 h-px bg-ink/[0.06]" />

            {/* Projects */}
            <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.16em] text-ink/50">
              Projects
            </p>
            <div className="mb-3">
              {recentWork.map((project) =>
                project.link ? (
                  <a
                    key={project.id}
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between -mx-2 rounded px-2 py-[7px] transition-colors duration-100 hover:bg-ink/[0.04]"
                  >
                    <span className="min-w-0 truncate text-[15px] leading-[1.4] tracking-[-0.014em] text-ink/70 transition-colors duration-100 group-hover:text-ink/90">
                      {project.title}
                    </span>
                    <span className="ml-2 flex shrink-0 items-center gap-1.5">
                      <span className="tabular-nums text-[11px] text-muted/40">{project.year}</span>
                      <span className="text-[11px] text-ink/20 transition-[transform,color] duration-100 group-hover:translate-x-[3px] group-hover:text-ink/50">›</span>
                    </span>
                  </a>
                ) : (
                  <Link
                    key={project.id}
                    href="/projects"
                    className="group flex items-center justify-between -mx-2 rounded px-2 py-[7px] transition-colors duration-100 hover:bg-ink/[0.04]"
                  >
                    <span className="min-w-0 truncate text-[15px] leading-[1.4] tracking-[-0.014em] text-ink/70 transition-colors duration-100 group-hover:text-ink/90">
                      {project.title}
                    </span>
                    <span className="ml-2 flex shrink-0 items-center gap-1.5">
                      <span className="tabular-nums text-[11px] text-muted/40">{project.year}</span>
                      <span className="text-[11px] text-ink/20 transition-[transform,color] duration-100 group-hover:translate-x-[3px] group-hover:text-ink/50">›</span>
                    </span>
                  </Link>
                )
              )}
            </div>
            <Link
              href="/projects"
              className="group inline-flex items-center gap-0.5 text-[12px] text-gold transition-opacity duration-150 hover:opacity-75"
            >
              View all projects
              <span className="transition-transform duration-150 group-hover:translate-x-[3px]">→</span>
            </Link>

          </div>
        </motion.div>

        {/* ── Desktop portrait ── */}
        <motion.div
          className="relative hidden flex-1 lg:block"
          aria-hidden="true"
          initial={rm ? { opacity: 0 } : { opacity: 0, filter: 'blur(6px)' }}
          animate={rm ? { opacity: 1 } : { opacity: 1, filter: 'blur(0px)' }}
          exit={rm ? { opacity: 0 } : { opacity: 0, x: '8%', transition: { duration: 0.4, delay: 0.04, ease: EASE_EXPO } }}
          transition={rm ? { duration: 0 } : { duration: 0.7, delay: 0.14, ease: EASE_EXPO }}
        >
          {(['builder', 'creator'] as const).map((p) => (
            <motion.div
              key={p}
              className="absolute inset-0"
              initial={false}
              animate={{ opacity: p === persona ? 1 : 0 }}
              transition={rm ? { duration: 0 } : { duration: 0.42, ease: EASE_EXPO }}
            >
              <Image
                src={CONTENT[p].portrait.src}
                alt={p === persona ? CONTENT[p].portrait.alt : ''}
                fill
                className="object-contain object-right-bottom"
                priority={p === 'builder'}
                sizes="(min-width: 1280px) 42vw, (min-width: 1024px) 55vw, 0vw"
              />
            </motion.div>
          ))}
          {/* Left-fade gradient — integrates portrait into layout */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-surface to-transparent" />
        </motion.div>

      </main>
    </div>
  );
}
