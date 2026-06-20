import { getExperience } from '@/lib/data';
import { deleteExperienceAction } from '@/lib/actions';
import DeleteForm from '@/components/admin/DeleteForm';
import Link from 'next/link';

export const metadata = { title: 'Experience — Swethank OS' };

export default function AdminExperiencePage() {
  const entries = getExperience();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-ink/[0.07] px-8 py-6">
        <div>
          <p className="mb-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-ink/35">
            Content
          </p>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">Experience</h1>
        </div>
        <Link
          href="/admin/experience/new"
          className="rounded-full bg-ink px-5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-85"
        >
          New entry
        </Link>
      </div>

      <div className="px-8 py-6">
        {entries.length === 0 ? (
          <div className="rounded-xl border border-ink/[0.08] py-16 text-center">
            <p className="text-[14px] text-ink/35">No experience entries yet.</p>
            <Link
              href="/admin/experience/new"
              className="mt-3 inline-block text-[13px] text-ink/50 hover:text-ink transition-colors"
            >
              Add your first role →
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
                  <p className="mb-0.5 text-[14px] font-medium text-ink">
                    {entry.role}
                  </p>
                  <div className="flex items-center gap-2 text-[12px] text-ink/40">
                    <span className="font-medium text-ink/55">{entry.company}</span>
                    <span className="text-ink/20">·</span>
                    <span>{entry.startDate} – {entry.endDate}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  <span className="text-[12px] text-ink/30">Order: {entry.order}</span>
                  <DeleteForm
                    action={deleteExperienceAction}
                    id={entry.id}
                    label={`${entry.role} at ${entry.company}`}
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
