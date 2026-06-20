import { createResearchAction } from '@/lib/actions';
import Link from 'next/link';

export const metadata = { title: 'New Research Entry — Swethank OS' };

const INPUT = 'w-full rounded-lg border border-ink/[0.12] bg-[#fafafa] px-4 py-2.5 text-[15px] text-ink placeholder:text-ink/25 transition-colors focus:border-ink/30 focus:bg-white focus:outline-none';
const LABEL = 'mb-1.5 block text-[12px] font-medium tracking-[0.02em] text-ink/45';

export default function NewResearchPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-ink/[0.07] px-8 py-5">
        <Link href="/admin/research" className="text-[13px] text-ink/35 hover:text-ink transition-colors">
          ← Research
        </Link>
        <h1 className="text-[18px] font-semibold tracking-[-0.018em] text-ink">New research entry</h1>
      </div>

      <div className="px-8 py-8">
        <form action={createResearchAction} className="max-w-[640px] space-y-8">

          {/* Core */}
          <div className="space-y-5">
            <div>
              <label className={LABEL}>Title *</label>
              <input name="title" required placeholder="Research title" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Abstract *</label>
              <textarea
                name="abstract"
                required
                rows={5}
                placeholder="Summary of the research, methodology, and findings"
                className={`${INPUT} resize-y leading-[1.6]`}
              />
            </div>
          </div>

          {/* Meta */}
          <div className="border-t border-ink/[0.07] pt-7">
            <p className="mb-5 text-[12px] font-medium uppercase tracking-[0.10em] text-ink/30">Publication</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={LABEL}>Year</label>
                <input
                  name="year"
                  type="number"
                  defaultValue={currentYear}
                  min={2000}
                  max={2100}
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>Status</label>
                <select name="status" className={INPUT}>
                  <option value="in-progress">In Progress</option>
                  <option value="under-review">Under Review</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
            <div className="mt-5">
              <label className={LABEL}>Venue (conference, journal, or institution)</label>
              <input
                name="venue"
                placeholder="e.g. IIT Bombay, NeurIPS, Nature"
                className={INPUT}
              />
            </div>
            <div className="mt-5">
              <label className={LABEL}>Tags (comma-separated)</label>
              <input name="tags" placeholder="ML, Bioinformatics, Genomics" className={INPUT} />
            </div>
            <div className="mt-5">
              <label className={LABEL}>Paper / preprint link</label>
              <input name="link" type="url" placeholder="https://arxiv.org/..." className={INPUT} />
            </div>
          </div>

          {/* Visibility */}
          <div className="border-t border-ink/[0.07] pt-7">
            <p className="mb-5 text-[12px] font-medium uppercase tracking-[0.10em] text-ink/30">Visibility</p>
            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" name="published" className="h-4 w-4 rounded accent-ink" />
              <div>
                <p className="text-[14px] font-medium text-ink">Publish immediately</p>
                <p className="text-[12px] text-ink/40">Visible on the public research page</p>
              </div>
            </label>
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
              href="/admin/research"
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
