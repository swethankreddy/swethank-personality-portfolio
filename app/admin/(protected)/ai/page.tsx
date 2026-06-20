import { getProjects, getResearch } from '@/lib/data';

export const metadata = { title: 'AI Workspace — Swethank OS' };

export default function AIWorkspacePage() {
  const projects  = getProjects().filter((p) => p.published);
  const research  = getResearch().filter((r) => r.published);

  const contextSources = [
    {
      label: 'Published Projects',
      count: projects.length,
      desc: 'Projects fed to the chatbot as structured context',
      file: 'data/projects.json',
    },
    {
      label: 'Research Entries',
      count: research.length,
      desc: 'Research entries visible to the chatbot',
      file: 'data/research.json',
    },
    {
      label: 'Chat API Route',
      count: null,
      desc: 'System prompt, model selection, rate limits',
      file: 'app/api/chat/route.ts',
    },
    {
      label: 'Context Builder',
      count: null,
      desc: 'Builds dynamic context from published content',
      file: 'lib/chat-context.ts',
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="border-b border-ink/[0.07] px-8 py-6">
        <p className="mb-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-ink/35">
          System
        </p>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">AI Workspace</h1>
      </div>

      <div className="px-8 py-8 max-w-[640px] space-y-10">

        {/* Status */}
        <section>
          <h2 className="mb-4 text-[16px] font-semibold tracking-[-0.015em] text-ink">
            Chatbot Status
          </h2>
          <div className="divide-y divide-ink/[0.06] rounded-xl border border-ink/[0.08]">
            <div className="flex items-center justify-between px-5 py-3.5">
              <p className="text-[13px] text-ink/60">Model</p>
              <p className="font-mono text-[13px] text-ink">gemini-2.5-flash</p>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5">
              <p className="text-[13px] text-ink/60">Rate limit (production)</p>
              <p className="font-mono text-[13px] text-ink">10 req / day per IP</p>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5">
              <p className="text-[13px] text-ink/60">Rate limit (development)</p>
              <p className="font-mono text-[13px] text-ink">50 req / day per IP</p>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5">
              <p className="text-[13px] text-ink/60">Context window</p>
              <p className="font-mono text-[13px] text-ink">Dynamic, ~6K tokens</p>
            </div>
          </div>
        </section>

        {/* Context sources */}
        <section>
          <h2 className="mb-4 text-[16px] font-semibold tracking-[-0.015em] text-ink">
            Context Sources
          </h2>
          <div className="divide-y divide-ink/[0.06] rounded-xl border border-ink/[0.08]">
            {contextSources.map((src) => (
              <div key={src.label} className="px-5 py-4">
                <div className="mb-0.5 flex items-center justify-between gap-3">
                  <p className="text-[14px] font-medium text-ink">{src.label}</p>
                  {src.count !== null && (
                    <span className="text-[13px] font-medium text-ink/50">
                      {src.count} item{src.count !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <p className="mb-1 text-[12px] text-ink/40">{src.desc}</p>
                <code className="text-[11px] text-ink/30">{src.file}</code>
              </div>
            ))}
          </div>
        </section>

        {/* Project context details */}
        {projects.length > 0 && (
          <section>
            <h2 className="mb-4 text-[16px] font-semibold tracking-[-0.015em] text-ink">
              Projects in Chatbot Context
            </h2>
            <div className="divide-y divide-ink/[0.06] rounded-xl border border-ink/[0.08]">
              {projects.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3">
                  <p className="text-[13px] text-ink/70">{p.title}</p>
                  <span
                    className={[
                      'rounded-full px-2 py-0.5 text-[11px] font-medium',
                      p.status === 'active'
                        ? 'bg-[#34c759]/10 text-[#1a7a2e]'
                        : 'bg-ink/[0.05] text-ink/40',
                    ].join(' ')}
                  >
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* System prompt note */}
        <section className="border-t border-ink/[0.07] pt-8">
          <h2 className="mb-3 text-[16px] font-semibold tracking-[-0.015em] text-ink">
            System Prompt
          </h2>
          <div className="rounded-xl border border-ink/[0.08] px-5 py-4">
            <p className="text-[13px] text-ink/45 leading-[1.6]">
              The system prompt is managed in code at{' '}
              <code className="rounded bg-ink/[0.06] px-1 py-0.5 font-mono text-[12px]">
                app/api/chat/route.ts
              </code>
              . It instructs the chatbot on personality, tone, available projects,
              and how to handle visitor questions. Edit the file directly to update the prompt.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
