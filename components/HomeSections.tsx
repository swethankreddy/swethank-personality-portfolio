import { getPublishedWriting, getPublishedProjects } from '@/lib/data';
import Link from 'next/link';

const CURRENT = [
  { label: 'Researching', value: 'Cancer Omics' },
  { label: 'Working',     value: 'Investment Analyst @ AUM Ventures' },
  { label: 'Writing',     value: 'AI, Research & Systems' },
  { label: 'Building',    value: 'AI Products · Research Tools · System Design' },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-8 text-[13px] italic text-muted/55 tracking-[0.01em]">
      {children}
    </p>
  );
}

function Row({
  left,
  right,
  href,
  external,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  href?: string;
  external?: boolean;
}) {
  const inner = (
    <div className="grid grid-cols-[120px_1fr] items-baseline gap-6 rounded-lg py-2 sm:grid-cols-[150px_1fr]">
      <span className="text-[13px] text-muted/50">{left}</span>
      <span className="text-[15px] leading-[1.4] tracking-[-0.01em] text-ink">
        {right}
      </span>
    </div>
  );

  if (href && external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="-mx-2 block rounded-lg px-2 transition-colors duration-150 hover:bg-ink/[0.04]"
      >
        {inner}
      </a>
    );
  }
  if (href) {
    return (
      <Link
        href={href}
        className="-mx-2 block rounded-lg px-2 transition-colors duration-150 hover:bg-ink/[0.04]"
      >
        {inner}
      </Link>
    );
  }
  return inner;
}

export default function HomeSections() {
  const posts    = getPublishedWriting().slice(0, 3);
  const projects = getPublishedProjects().slice(0, 4);

  return (
    <div className="border-t border-ink/[0.08] bg-surface">
      <div className="px-6 py-16 sm:px-10 lg:px-16 lg:py-20">
        <div className="max-w-[640px] space-y-14">

          {/* ── current ─────────────────────────────────────────────── */}
          <section aria-label="Currently">
            <SectionLabel>current</SectionLabel>
            <div className="space-y-3">
              {CURRENT.map(({ label, value }) => (
                <Row key={label} left={label} right={value} />
              ))}
            </div>
          </section>

          {/* ── writing ─────────────────────────────────────────────── */}
          <section aria-label="Writing">
            <SectionLabel>writing</SectionLabel>
            {posts.length === 0 ? (
              <p className="text-[15px] text-muted/40">Nothing published yet.</p>
            ) : (
              <>
                <div className="space-y-0.5">
                  {posts.map((post) => (
                    <Row
                      key={post.id}
                      left={
                        <time>
                          {new Date(post.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day:   'numeric',
                            year:  'numeric',
                          })}
                        </time>
                      }
                      right={post.title}
                    />
                  ))}
                </div>
                <div className="mt-7">
                  <Link
                    href="/writing"
                    className="text-[13px] text-muted/55 underline underline-offset-4 hover:text-ink transition-colors duration-150"
                  >
                    read all writing →
                  </Link>
                </div>
              </>
            )}
          </section>

          {/* ── projects ─────────────────────────────────────────────── */}
          <section aria-label="Projects">
            <SectionLabel>projects</SectionLabel>
            {projects.length === 0 ? (
              <p className="text-[15px] text-muted/40">Nothing yet.</p>
            ) : (
              <>
                <div className="space-y-0.5">
                  {projects.map((project) => (
                    <Row
                      key={project.id}
                      left={<span>{project.year}</span>}
                      right={project.title}
                      href={project.link ?? '/projects'}
                      external={!!project.link}
                    />
                  ))}
                </div>
                <div className="mt-7">
                  <Link
                    href="/projects"
                    className="text-[13px] text-muted/55 underline underline-offset-4 hover:text-ink transition-colors duration-150"
                  >
                    all projects →
                  </Link>
                </div>
              </>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
