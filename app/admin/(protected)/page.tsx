import { getWriting, getProjects, getResearch, getExperience, getCurrentStatus } from '@/lib/data';
import Link from 'next/link';

export const metadata = { title: 'Dashboard — Swethank OS' };

function Stat({
  label,
  value,
  sub,
  href,
}: {
  label: string;
  value: number;
  sub?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-xl border border-ink/[0.08] bg-white p-5 transition-colors duration-150 hover:border-ink/20"
    >
      <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.11em] text-ink/35">
        {label}
      </p>
      <p className="mb-0.5 text-[28px] font-bold tracking-[-0.02em] text-ink">
        {value}
      </p>
      {sub && (
        <p className="text-[12px] text-ink/35">{sub}</p>
      )}
    </Link>
  );
}

export default function AdminPage() {
  const posts     = getWriting();
  const projects  = getProjects();
  const research  = getResearch();
  const experience = getExperience();
  const current   = getCurrentStatus();

  const publishedPosts    = posts.filter((p) => p.published).length;
  const draftPosts        = posts.length - publishedPosts;
  const publishedProjects = projects.filter((p) => p.published).length;
  const draftProjects     = projects.length - publishedProjects;

  // Recently updated (last 5 items across all types, by date)
  const recent = [
    ...posts.map((p) => ({
      label: p.title,
      type: 'Writing' as const,
      href: `/admin/writing`,
      status: p.published,
      date: p.date,
    })),
    ...projects.map((p) => ({
      label: p.title,
      type: 'Project' as const,
      href: `/admin/projects`,
      status: p.published,
      date: `${p.year}-01-01`,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  return (
    <div>
      {/* Page header */}
      <div className="border-b border-ink/[0.07] px-8 py-6">
        <p className="mb-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-ink/35">
          Overview
        </p>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">
          Dashboard
        </h1>
      </div>

      <div className="px-8 py-8">

        {/* Stats grid */}
        <div className="mb-10 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <Stat
            label="Projects"
            value={projects.length}
            sub={`${publishedProjects} published · ${draftProjects} draft`}
            href="/admin/projects"
          />
          <Stat
            label="Writing"
            value={posts.length}
            sub={`${publishedPosts} published · ${draftPosts} draft`}
            href="/admin/writing"
          />
          <Stat
            label="Research"
            value={research.length}
            sub={research.length === 0 ? 'None added yet' : `${research.filter((r) => r.published).length} published`}
            href="/admin/research"
          />
          <Stat
            label="Experience"
            value={experience.length}
            sub={experience.length === 0 ? 'None added yet' : `${experience.length} entries`}
            href="/admin/experience"
          />
        </div>

        {/* Quick actions */}
        <div className="mb-10">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.11em] text-ink/35">
            Quick Actions
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { href: '/admin/projects/new', label: 'New project' },
              { href: '/admin/writing/new',  label: 'New post' },
              { href: '/admin/research/new', label: 'New research' },
              { href: '/admin/experience/new', label: 'New experience' },
              { href: '/admin/settings',     label: 'Edit status' },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="rounded-full border border-ink/[0.12] px-4 py-1.5 text-[13px] text-ink/60 transition-colors duration-150 hover:border-ink/25 hover:text-ink"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Recent content */}
        {recent.length > 0 && (
          <div>
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.11em] text-ink/35">
              Recent Content
            </p>
            <div className="divide-y divide-ink/[0.06] rounded-xl border border-ink/[0.08]">
              {recent.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium text-ink">
                      {item.label}
                    </p>
                    <p className="text-[12px] text-ink/35">{item.type}</p>
                  </div>
                  <span
                    className={[
                      'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
                      item.status
                        ? 'bg-[#34c759]/10 text-[#1a7a2e]'
                        : 'bg-ink/[0.06] text-ink/40',
                    ].join(' ')}
                  >
                    {item.status ? 'Published' : 'Draft'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current status preview */}
        {current.length > 0 && (
          <div className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-medium uppercase tracking-[0.11em] text-ink/35">
                Homepage Status
              </p>
              <Link
                href="/admin/settings"
                className="text-[12px] text-ink/40 hover:text-ink transition-colors"
              >
                Edit →
              </Link>
            </div>
            <div className="space-y-1.5">
              {current.map((s, i) => (
                <p key={i} className="text-[14px] text-ink/60">
                  {s}
                </p>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
