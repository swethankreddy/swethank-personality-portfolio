import { getCurrentStatus } from '@/lib/data';
import { updateCurrentStatusAction } from '@/lib/actions';

export const metadata = { title: 'Current Status — Admin' };

export default function AdminCurrentPage() {
  const sentences = getCurrentStatus();
  const slots = [...sentences, '', '', '', ''].slice(0, 4);

  return (
    <main className="px-6 py-12 sm:px-10">
      <div className="max-w-[640px]">
        <div className="mb-10">
          <h1 className="text-[24px] font-bold tracking-[-0.02em] text-ink">
            Current Status
          </h1>
          <p className="mt-2 text-[14px] text-muted/60">
            These sentences appear in the center column of the homepage. Keep them concise — one thought per sentence.
          </p>
        </div>

        <form action={updateCurrentStatusAction}>
          <div className="space-y-4">
            {slots.map((sentence, i) => (
              <div key={i}>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.10em] text-muted/50">
                  Sentence {i + 1}{i >= 3 ? ' (optional)' : ''}
                </label>
                <input
                  type="text"
                  name={`sentence_${i}`}
                  defaultValue={sentence}
                  placeholder={
                    i === 0
                      ? 'e.g. Researching cancer omics.'
                      : i === 1
                        ? 'e.g. Investment Analyst at AUM Ventures.'
                        : i === 2
                          ? 'e.g. Building AI products and research tools.'
                          : 'Optional 4th sentence'
                  }
                  className="w-full rounded-lg border border-ink/[0.12] bg-transparent px-4 py-3 text-[15px] text-ink placeholder:text-muted/30 transition-colors focus:border-ink/30 focus:outline-none"
                />
              </div>
            ))}
          </div>

          <div className="mt-8">
            <button
              type="submit"
              className="rounded-full bg-ink px-6 py-2.5 text-[13px] font-medium text-surface transition-opacity hover:opacity-90"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
