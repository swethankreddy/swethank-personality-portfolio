import { getWriting } from '@/lib/data';
import { deleteWritingAction } from '@/lib/actions';
import DeleteForm from '@/components/admin/DeleteForm';
import Link from 'next/link';

export const metadata = { title: 'Writing — Swethank OS' };

export default function AdminWritingPage() {
  const posts = getWriting().sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const published = posts.filter((p) => p.published).length;
  const drafts    = posts.filter((p) => !p.published).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-ink/[0.07] px-8 py-6">
        <div>
          <p className="mb-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-ink/35">
            Content
          </p>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">Writing</h1>
        </div>
        <Link
          href="/admin/writing/new"
          className="rounded-full bg-ink px-5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-85"
        >
          New post
        </Link>
      </div>

      <div className="px-8 py-6">

        {/* Summary */}
        <div className="mb-6 flex gap-4 text-[13px] text-ink/45">
          <span><strong className="font-semibold text-ink">{posts.length}</strong> total</span>
          <span><strong className="font-semibold text-[#1a7a2e]">{published}</strong> published</span>
          {drafts > 0 && (
            <span><strong className="font-semibold text-ink/60">{drafts}</strong> draft</span>
          )}
        </div>

        {posts.length === 0 ? (
          <div className="rounded-xl border border-ink/[0.08] py-16 text-center">
            <p className="text-[14px] text-ink/35">No posts yet.</p>
            <Link
              href="/admin/writing/new"
              className="mt-3 inline-block text-[13px] text-ink/50 hover:text-ink transition-colors"
            >
              Write your first post →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-ink/[0.06] rounded-xl border border-ink/[0.08]">
            {posts.map((post) => (
              <div
                key={post.id}
                className="group flex items-center gap-4 px-5 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="mb-1 truncate text-[14px] font-medium text-ink">
                    {post.title}
                  </p>
                  <div className="flex items-center gap-2 text-[12px] text-ink/40">
                    <span>
                      {new Date(post.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-ink/20">·</span>
                    <span
                      className={[
                        'rounded-full px-2 py-0.5 text-[11px] font-medium',
                        post.published
                          ? 'bg-[#34c759]/10 text-[#1a7a2e]'
                          : 'bg-ink/[0.06] text-ink/40',
                      ].join(' ')}
                    >
                      {post.published ? 'Published' : 'Draft'}
                    </span>
                    {post.tags.length > 0 && (
                      <>
                        <span className="text-ink/20">·</span>
                        <span className="truncate">{post.tags.slice(0, 3).join(', ')}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  <Link
                    href={`/admin/writing/${post.id}/edit`}
                    className="text-[13px] text-ink/45 hover:text-ink transition-colors"
                  >
                    Edit
                  </Link>
                  <DeleteForm
                    action={deleteWritingAction}
                    id={post.id}
                    label={post.title}
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
