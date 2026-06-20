import { notFound } from 'next/navigation';
import { getProjectById } from '@/lib/data';
import { updateProjectAction } from '@/lib/actions';
import Link from 'next/link';

export const metadata = { title: 'Edit Project — Swethank OS' };

const INPUT = 'w-full rounded-lg border border-ink/[0.12] bg-[#fafafa] px-4 py-2.5 text-[15px] text-ink placeholder:text-ink/25 transition-colors focus:border-ink/30 focus:bg-white focus:outline-none';
const LABEL = 'mb-1.5 block text-[12px] font-medium tracking-[0.02em] text-ink/45';

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProjectById(id);
  if (!project) notFound();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-ink/[0.07] px-8 py-5">
        <Link href="/admin/projects" className="text-[13px] text-ink/35 hover:text-ink transition-colors">
          ← Projects
        </Link>
        <h1 className="text-[18px] font-semibold tracking-[-0.018em] text-ink">
          Edit project
        </h1>
      </div>

      <div className="px-8 py-8">
        <form action={updateProjectAction} className="max-w-[640px] space-y-8">
          <input type="hidden" name="id" value={project.id} />

          {/* Core */}
          <div className="space-y-5">
            <div>
              <label className={LABEL}>Title *</label>
              <input
                name="title"
                required
                defaultValue={project.title}
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Description *</label>
              <textarea
                name="description"
                required
                rows={6}
                defaultValue={project.description}
                className={`${INPUT} resize-y leading-[1.6]`}
              />
            </div>
          </div>

          {/* Meta */}
          <div className="border-t border-ink/[0.07] pt-7">
            <p className="mb-5 text-[12px] font-medium uppercase tracking-[0.10em] text-ink/30">Metadata</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={LABEL}>Year</label>
                <input
                  name="year"
                  type="number"
                  defaultValue={project.year}
                  min={2000}
                  max={2100}
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>Status</label>
                <select name="status" defaultValue={project.status} className={INPUT}>
                  <option value="completed">Completed</option>
                  <option value="active">Active Research</option>
                  <option value="wip">In Progress</option>
                </select>
              </div>
            </div>
            <div className="mt-5">
              <label className={LABEL}>Tags (comma-separated)</label>
              <input
                name="tags"
                defaultValue={project.tags.join(', ')}
                placeholder="AI, PyTorch, Research"
                className={INPUT}
              />
            </div>
          </div>

          {/* Links */}
          <div className="border-t border-ink/[0.07] pt-7">
            <p className="mb-5 text-[12px] font-medium uppercase tracking-[0.10em] text-ink/30">Links</p>
            <div className="space-y-4">
              <div>
                <label className={LABEL}>GitHub URL</label>
                <input
                  name="github"
                  type="url"
                  defaultValue={project.github ?? ''}
                  placeholder="https://github.com/..."
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>Demo / Live URL</label>
                <input
                  name="demo"
                  type="url"
                  defaultValue={project.demo ?? ''}
                  placeholder="https://..."
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>Primary link (fallback)</label>
                <input
                  name="link"
                  type="url"
                  defaultValue={project.link}
                  placeholder="https://..."
                  className={INPUT}
                />
              </div>
            </div>
          </div>

          {/* Explore In Depth */}
          <div className="border-t border-ink/[0.07] pt-7">
            <p className="mb-1 text-[12px] font-medium uppercase tracking-[0.10em] text-ink/30">Explore In Depth</p>
            <p className="mb-5 text-[12px] text-ink/35">Content shown in the project detail panel. Supports markdown.</p>
            <div className="space-y-5">
              <div>
                <label className={LABEL}>Detailed Overview</label>
                <textarea
                  name="detail_overview"
                  rows={5}
                  defaultValue={project.detail?.overview ?? ''}
                  placeholder="What did you build, and what was the approach? Use markdown bullet points for clarity."
                  className={`${INPUT} resize-y leading-[1.6]`}
                />
              </div>
              <div>
                <label className={LABEL}>Technical Implementation</label>
                <textarea
                  name="detail_implementation"
                  rows={5}
                  defaultValue={project.detail?.implementation ?? ''}
                  placeholder="How did you build it? Key architectural decisions, algorithms, system design."
                  className={`${INPUT} resize-y leading-[1.6]`}
                />
              </div>
              <div>
                <label className={LABEL}>Challenges</label>
                <textarea
                  name="detail_challenges"
                  rows={4}
                  defaultValue={project.detail?.challenges ?? ''}
                  placeholder="What was hard? What did you figure out along the way?"
                  className={`${INPUT} resize-y leading-[1.6]`}
                />
              </div>
              <div>
                <label className={LABEL}>Results & Impact</label>
                <textarea
                  name="detail_results"
                  rows={3}
                  defaultValue={project.detail?.results ?? ''}
                  placeholder="Metrics, outcomes, what it achieved."
                  className={`${INPUT} resize-y leading-[1.6]`}
                />
              </div>
              <div>
                <label className={LABEL}>Tech Stack Notes</label>
                <textarea
                  name="detail_techStack"
                  rows={2}
                  defaultValue={project.detail?.techStack ?? ''}
                  placeholder="Full stack breakdown, versions, or context not captured by tags."
                  className={`${INPUT} resize-y leading-[1.6]`}
                />
              </div>
            </div>
          </div>

          {/* Visibility */}
          <div className="border-t border-ink/[0.07] pt-7">
            <p className="mb-5 text-[12px] font-medium uppercase tracking-[0.10em] text-ink/30">Visibility</p>
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  name="published"
                  defaultChecked={project.published}
                  className="h-4 w-4 rounded accent-ink"
                />
                <div>
                  <p className="text-[14px] font-medium text-ink">Published</p>
                  <p className="text-[12px] text-ink/40">Visible on the public projects page</p>
                </div>
              </label>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  name="featured"
                  defaultChecked={project.featured ?? false}
                  className="h-4 w-4 rounded accent-ink"
                />
                <div>
                  <p className="text-[14px] font-medium text-ink">Featured</p>
                  <p className="text-[12px] text-ink/40">Highlighted in the projects browser</p>
                </div>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="rounded-full bg-ink px-6 py-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-85"
            >
              Save changes
            </button>
            <Link
              href="/admin/projects"
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
