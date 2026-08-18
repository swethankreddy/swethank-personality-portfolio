import { readChatEvents, summarize } from '@/lib/observability';

export const metadata = { title: 'Observability — Swethank OS' };
export const dynamic = 'force-dynamic';

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-ink/[0.08] px-4 py-3">
      <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.12em] text-ink/35">
        {label}
      </p>
      <p className="text-[20px] font-semibold tracking-[-0.02em] text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-[12px] text-ink/45">{sub}</p>}
    </div>
  );
}

export default function ObservabilityPage() {
  const events = readChatEvents(200);
  const s = summarize(events);

  return (
    <div>
      {/* Header */}
      <div className="border-b border-ink/[0.07] px-8 py-6">
        <p className="mb-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-ink/35">
          System
        </p>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">Observability</h1>
        <p className="mt-1 text-[13px] text-ink/50">
          Last {events.length} chat requests, read from{' '}
          <code className="text-[12px]">.observability/events.jsonl</code>
        </p>
      </div>

      {s.total === 0 ? (
        <div className="px-8 py-10">
          <p className="text-[14px] text-ink/50">
            No events recorded yet. Send a message through the chat, or run{' '}
            <code className="text-[13px]">node evaluation/run-eval.mjs --live</code>.
          </p>
        </div>
      ) : (
        <div className="px-8 py-6">
          {/* Summary tiles */}
          <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-3">
            <Stat label="Requests" value={String(s.total)} />
            <Stat
              label="Success rate"
              value={`${((s.successRate ?? 0) * 100).toFixed(1)}%`}
            />
            <Stat label="Avg latency" value={`${s.avgLatencyMs} ms`} sub={`p95 ${s.p95LatencyMs} ms`} />
            <Stat label="Avg context" value={`${s.avgContextChars} chars`} sub="system prompt size" />
            <Stat label="Avg tool calls" value={String(s.avgToolCalls)} />
            <Stat
              label="Retrieval paths"
              value={Object.entries(s.pathCounts)
                .map(([k, v]) => `${k}: ${v}`)
                .join('  ')}
            />
          </div>

          {/* Most retrieved items */}
          {s.topIds.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-2 text-[13px] font-semibold text-ink">Most retrieved items</h2>
              <div className="flex flex-wrap gap-2">
                {s.topIds.map(({ id, count }) => (
                  <span
                    key={id}
                    className="rounded-md border border-ink/[0.08] px-2.5 py-1 text-[12px] text-ink/70"
                  >
                    {id} <span className="text-ink/40">×{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent requests */}
          <h2 className="mb-2 text-[13px] font-semibold text-ink">Recent requests</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-ink/[0.08] text-[11px] uppercase tracking-[0.08em] text-ink/40">
                  <th className="py-2 pr-4 font-medium">Time</th>
                  <th className="py-2 pr-4 font-medium">Query</th>
                  <th className="py-2 pr-4 font-medium">Path</th>
                  <th className="py-2 pr-4 font-medium">Tools</th>
                  <th className="py-2 pr-4 font-medium">Retrieved</th>
                  <th className="py-2 pr-4 font-medium">Latency</th>
                  <th className="py-2 font-medium">OK</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e, i) => (
                  <tr key={i} className="border-b border-ink/[0.05] align-top">
                    <td className="py-2 pr-4 whitespace-nowrap text-ink/45">
                      {e.ts.slice(11, 19)}
                    </td>
                    <td className="max-w-[280px] py-2 pr-4 text-ink/80">{e.query}</td>
                    <td className="py-2 pr-4 whitespace-nowrap text-ink/60">{e.retrievalPath}</td>
                    <td className="py-2 pr-4 text-ink/60">{e.toolsCalled.join(', ') || '—'}</td>
                    <td className="py-2 pr-4 text-ink/60">{e.retrievedIds.join(', ') || '—'}</td>
                    <td className="py-2 pr-4 whitespace-nowrap text-ink/60">{e.latencyMs} ms</td>
                    <td className="py-2">{e.success ? '✓' : '✕'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
