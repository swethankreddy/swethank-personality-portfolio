import { createExperienceAction } from '@/lib/actions';
import Link from 'next/link';

export const metadata = { title: 'New Experience Entry — Swethank OS' };

const INPUT = 'w-full rounded-lg border border-ink/[0.12] bg-[#fafafa] px-4 py-2.5 text-[15px] text-ink placeholder:text-ink/25 transition-colors focus:border-ink/30 focus:bg-white focus:outline-none';
const LABEL = 'mb-1.5 block text-[12px] font-medium tracking-[0.02em] text-ink/45';

export default function NewExperiencePage() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-ink/[0.07] px-8 py-5">
        <Link href="/admin/experience" className="text-[13px] text-ink/35 hover:text-ink transition-colors">
          ← Experience
        </Link>
        <h1 className="text-[18px] font-semibold tracking-[-0.018em] text-ink">New experience entry</h1>
      </div>

      <div className="px-8 py-8">
        <form action={createExperienceAction} className="max-w-[640px] space-y-8">

          {/* Role info */}
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={LABEL}>Company / Organization *</label>
                <input
                  name="company"
                  required
                  placeholder="e.g. AUM Ventures"
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>Role / Title *</label>
                <input
                  name="role"
                  required
                  placeholder="e.g. Investment Analyst"
                  className={INPUT}
                />
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={LABEL}>Start date</label>
                <input
                  name="startDate"
                  placeholder="e.g. Jan 2024"
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>End date</label>
                <input
                  name="endDate"
                  placeholder="Present"
                  defaultValue="Present"
                  className={INPUT}
                />
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="border-t border-ink/[0.07] pt-7">
            <p className="mb-5 text-[12px] font-medium uppercase tracking-[0.10em] text-ink/30">Details</p>
            <div className="space-y-5">
              <div>
                <label className={LABEL}>Description</label>
                <textarea
                  name="description"
                  rows={4}
                  placeholder="What you do / did in this role"
                  className={`${INPUT} resize-y leading-[1.6]`}
                />
              </div>
              <div>
                <label className={LABEL}>Skills (comma-separated)</label>
                <input
                  name="skills"
                  placeholder="Venture Analysis, Python, LLMs"
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>Display order (lower = higher on page)</label>
                <input
                  name="order"
                  type="number"
                  defaultValue={1}
                  min={1}
                  className={`${INPUT} w-32`}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="rounded-full bg-ink px-6 py-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-85"
            >
              Save entry
            </button>
            <Link
              href="/admin/experience"
              className="rounded-full border border-ink/[0.15] px-6 py-2.5 text-[13px] text-ink/50 hover:text-ink transition-colors"
            >
              Cancel
            </Link>
          </div>

        </form>
      </div>
    </div>
  );
}
