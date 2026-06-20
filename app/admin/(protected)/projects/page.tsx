import { getProjects } from '@/lib/data';
import { deleteProjectAction } from '@/lib/actions';
import DeleteForm from '@/components/admin/DeleteForm';
import Link from 'next/link';

export const metadata = { title: 'Projects — Swethank OS' };

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
  wip: 'In Progress',
};

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-[#34c759]/10 text-[#1a7a2e]',
  completed: 'bg-ink/[0.06] text-ink/40',
  wip:       'bg-[#ff9500]/10 text-[#8a5000]',
};

export default function AdminProjectsPage() {
  const projects = getProjects().sort((a, b) => b.year - a.year);

  const published = projects.filter((p) => p.published).length;
  const drafts    = projects.filter((p) => !p.published).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-ink/[0.07] px-8 py-6">
        <div>
          <p className="mb-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-ink/35">
            Content
          </p>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">
            Projects
          </h1>
        </div>
        <Link
          href="/admin/projects/new"
          className="rounded-full bg-ink px-5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-85"
        >
          New project
        </Link>
      </div>

      <div className="px-8 py-6">

        {/* Summary pills */}
        <div className="mb-6 flex gap-4 text-[13px] text-ink/45">
          <span><strong className="font-semibold text-ink">{projects.length}</strong> total</span>
          <span><strong className="font-semibold text-[#1a7a2e]">{published}</strong> published</span>
          {drafts > 0 && (
            <span><strong className="font-semibold text-ink/60">{drafts}</strong> draft</span>
          )}
        </div>

        {projects.length === 0 ? (
          <div className="rounded-xl border border-ink/[0.08] py-16 text-center">
            <p className="text-[14px] text-ink/35">No projects yet.</p>
            <Link
              href="/admin/projects/new"
              className="mt-3 inline-block text-[13px] text-ink/50 hover:text-ink transition-colors"
            >
              Create your first project →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-ink/[0.06] rounded-xl border border-ink/[0.08]">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group flex items-center gap-4 px-5 py-4"
              >
                {/* Left: title + meta */}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2.5">
                    <p className="truncate text-[14px] font-medium text-ink">
                      {project.title}
                    </p>
                    {project.featured && (
                      <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-medium text-ink/50">
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-ink/40">
                    <span>{project.year}</span>
                    <span className="text-ink/20">·</span>
                    <span
                      className={[
                        'rounded-full px-2 py-0.5 text-[11px] font-medium',
                        STATUS_COLORS[project.status] ?? 'bg-ink/[0.06] text-ink/40',
                      ].join(' ')}
                    >
                      {STATUS_LABELS[project.status] ?? project.status}
                    </span>
                    <span className="text-ink/20">·</span>
                    <span
                      className={[
                        'rounded-full px-2 py-0.5 text-[11px] font-medium',
                        project.published
                          ? 'bg-[#34c759]/10 text-[#1a7a2e]'
                          : 'bg-ink/[0.06] text-ink/40',
                      ].join(' ')}
                    >
                      {project.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>

                {/* Right: actions */}
                <div className="flex shrink-0 items-center gap-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  <Link
                    href={`/admin/projects/${project.id}/edit`}
                    className="text-[13px] text-ink/45 hover:text-ink transition-colors"
                  >
                    Edit
                  </Link>
                  <DeleteForm
                    action={deleteProjectAction}
                    id={project.id}
                    label={project.title}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
