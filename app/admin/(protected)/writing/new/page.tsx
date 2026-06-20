import { createWritingAction } from '@/lib/actions';
import Link from 'next/link';

export const metadata = { title: 'New Post — Swethank OS' };

const INPUT = 'w-full rounded-lg border border-ink/[0.12] bg-[#fafafa] px-4 py-2.5 text-[15px] text-ink placeholder:text-ink/25 transition-colors focus:border-ink/30 focus:bg-white focus:outline-none';
const LABEL = 'mb-1.5 block text-[12px] font-medium tracking-[0.02em] text-ink/45';

export default function NewWritingPage() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-ink/[0.07] px-8 py-5">
        <Link href="/admin/writing" className="text-[13px] text-ink/35 hover:text-ink transition-colors">
          ← Writing
        </Link>
        <h1 className="text-[18px] font-semibold tracking-[-0.018em] text-ink">New post</h1>
      </div>

      <div className="px-8 py-8">
        <form action={createWritingAction} className="max-w-[640px] space-y-8">

          {/* Core */}
          <div className="space-y-5">
            <div>
              <label className={LABEL}>Title *</label>
              <input name="title" required placeholder="Post title" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Excerpt</label>
              <input
                name="excerpt"
                placeholder="One-line summary shown in the listing"
                className={INPUT}
              />
            </div>
          </div>

          {/* Content */}
          <div className="border-t border-ink/[0.07] pt-7">
            <p className="mb-5 text-[12px] font-medium uppercase tracking-[0.10em] text-ink/30">Content</p>
            <div>
              <label className={LABEL}>Body (Markdown)</label>
              <textarea
                name="content"
                rows={20}
                placeholder="Write in Markdown..."
                className={`${INPUT} resize-y font-mono text-[14px] leading-[1.65]`}
              />
              <p className="mt-1.5 text-[11px] text-ink/30">
                Supports Markdown: **bold**, _italic_, ## headings, - lists, `code`
              </p>
            </div>
          </div>

          {/* Meta */}
          <div className="border-t border-ink/[0.07] pt-7">
            <p className="mb-5 text-[12px] font-medium uppercase tracking-[0.10em] text-ink/30">Metadata</p>
            <div>
              <label className={LABEL}>Tags (comma-separated)</label>
              <input
                name="tags"
                placeholder="AI, Research, Systems"
                className={INPUT}
              />
            </div>
          </div>

          {/* Visibility */}
          <div className="border-t border-ink/[0.07] pt-7">
            <p className="mb-5 text-[12px] font-medium uppercase tracking-[0.10em] text-ink/30">Visibility</p>
            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" name="published" className="h-4 w-4 rounded accent-ink" />
              <div>
                <p className="text-[14px] font-medium text-ink">Publish immediately</p>
                <p className="text-[12px] text-ink/40">Visible on the public writing page</p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="rounded-full bg-ink px-6 py-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-85"
            >
              Create post
            </button>
            <Link
              href="/admin/writing"
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
