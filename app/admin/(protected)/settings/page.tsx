import { getCurrentStatus } from '@/lib/data';
import { updateCurrentStatusAction } from '@/lib/actions';

export const metadata = { title: 'Settings — Swethank OS' };

const INPUT = 'w-full rounded-lg border border-ink/[0.12] bg-[#fafafa] px-4 py-2.5 text-[15px] text-ink placeholder:text-ink/25 transition-colors focus:border-ink/30 focus:bg-white focus:outline-none';
const LABEL = 'mb-1.5 block text-[12px] font-medium tracking-[0.02em] text-ink/45';

export default function SettingsPage() {
  const sentences = getCurrentStatus();
  const slots = [...sentences, '', '', '', ''].slice(0, 4);

  return (
    <div>
      {/* Header */}
      <div className="border-b border-ink/[0.07] px-8 py-6">
        <p className="mb-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-ink/35">
          System
        </p>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">Settings</h1>
      </div>

      <div className="px-8 py-8 max-w-[640px] space-y-12">

        {/* Homepage Status */}
        <section>
          <div className="mb-6">
            <h2 className="text-[16px] font-semibold tracking-[-0.015em] text-ink">
              Homepage Status
            </h2>
            <p className="mt-1 text-[13px] text-ink/40">
              These sentences appear in the center column of the homepage. Keep them concise — one clear thought each.
            </p>
          </div>

          <form action={updateCurrentStatusAction} className="space-y-4">
            {slots.map((sentence, i) => (
              <div key={i}>
                <label className={LABEL}>
                  Sentence {i + 1}
                  {i >= 2 && <span className="ml-1 text-ink/30">(optional)</span>}
                </label>
                <input
                  type="text"
                  name={`sentence_${i}`}
                  defaultValue={sentence}
                  placeholder={
                    i === 0 ? 'e.g. Researching cancer omics at IIT Bombay.'
                    : i === 1 ? 'e.g. Investment Analyst at AUM Ventures.'
                    : i === 2 ? 'e.g. Building AI research tools.'
                    : 'Optional fourth sentence'
                  }
                  className={INPUT}
                />
              </div>
            ))}

            <div className="pt-2">
              <button
                type="submit"
                className="rounded-full bg-ink px-6 py-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-85"
              >
                Save status
              </button>
            </div>
          </form>
        </section>

        {/* Site Info (placeholder for future) */}
        <section className="border-t border-ink/[0.07] pt-10">
          <div className="mb-6">
            <h2 className="text-[16px] font-semibold tracking-[-0.015em] text-ink">
              Site Information
            </h2>
            <p className="mt-1 text-[13px] text-ink/40">
              Global site metadata and SEO settings.
            </p>
          </div>
          <div className="rounded-xl border border-ink/[0.08] px-5 py-4">
            <p className="text-[13px] text-ink/40">
              Managed in <code className="rounded bg-ink/[0.06] px-1 py-0.5 font-mono text-[12px]">app/layout.tsx</code> — edit title, description, and OG tags there directly.
            </p>
          </div>
        </section>

        {/* Social Links (placeholder) */}
        <section className="border-t border-ink/[0.07] pt-10">
          <div className="mb-6">
            <h2 className="text-[16px] font-semibold tracking-[-0.015em] text-ink">
              Social &amp; Contact
            </h2>
            <p className="mt-1 text-[13px] text-ink/40">
              Links shown in the footer and about page.
            </p>
          </div>
          <div className="rounded-xl border border-ink/[0.08] px-5 py-4">
            <p className="text-[13px] text-ink/40">
              Managed in <code className="rounded bg-ink/[0.06] px-1 py-0.5 font-mono text-[12px]">app/about/page.tsx</code> — add social links directly in that file.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
