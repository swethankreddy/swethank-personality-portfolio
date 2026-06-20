import { getResearch } from '@/lib/data';
import { deleteResearchAction } from '@/lib/actions';
import DeleteForm from '@/components/admin/DeleteForm';
import Link from 'next/link';

export const metadata = { title: 'Research — Swethank OS' };

const STATUS_LABELS: Record<string, string> = {
  'published':    'Published',
  'under-review': 'Under Review',
  'in-progress':  'In Progress',
};

const STATUS_COLORS: Record<string, string> = {
  'published':    'bg-[#34c759]/10 text-[#1a7a2e]',
  'under-review': 'bg-[#ff9500]/10 text-[#8a5000]',
  'in-progress':  'bg-ink/[0.06] text-ink/45',
};

export default function AdminResearchPage() {
  const entries = getResearch().sort((a, b) => b.year - a.year);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-ink/[0.07] px-8 py-6">
        <div>
          <p className="mb-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-ink/35">
            Content
          </p>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">Research</h1>
        </div>
        <Link
          href="/admin/research/new"
          className="rounded-full bg-ink px-5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-85"
        >
          New entry
        </Link>
      </div>

      <div className="px-8 py-6">
        {entries.length === 0 ? (
          <div className="rounded-xl border border-ink/[0.08] py-16 text-center">
            <p className="text-[14px] text-ink/35">No research entries yet.</p>
            <Link
              href="/admin/research/new"
              className="mt-3 inline-block text-[13px] text-ink/50 hover:text-ink transition-colors"
            >
              Add your first research entry →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-ink/[0.06] rounded-xl border border-ink/[0.08]">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="group flex items-center gap-4 px-5 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="mb-1 truncate text-[14px] font-medium text-ink">
                    {entry.title}
                  </p>
                  <div className="flex items-center gap-2 text-[12px] text-ink/40">
                    <span>{entry.year}</span>
                    {entry.venue && (
                      <>
                        <span className="text-ink/20">·</span>
                        <span className="truncate">{entry.venue}</span>
                      </>
                    )}
                    <span className="text-ink/20">·</span>
                    <span
                      className={[
                        'rounded-full px-2 py-0.5 text-[11px] font-medium',
                        STATUS_COLORS[entry.status] ?? 'bg-ink/[0.06] text-ink/40',
                      ].join(' ')}
                    >
                      {STATUS_LABELS[entry.status] ?? entry.status}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  <DeleteForm
                    action={deleteResearchAction}
                    id={entry.id}
                    label={entry.title}
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
