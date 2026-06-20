import { loginAction } from '@/lib/actions';

export const metadata = { title: 'Sign in — Swethank OS' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#111] px-6">
      <div className="w-full max-w-[320px]">
        <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.15em] text-white/25">
          Portfolio
        </p>
        <h1 className="mb-10 text-[22px] font-semibold tracking-[-0.015em] text-white">
          Swethank OS
        </h1>

        <form action={loginAction} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[12px] tracking-[0.02em] text-white/40">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              autoFocus
              className="w-full rounded-lg border border-white/[0.12] bg-white/[0.06] px-4 py-3 text-[15px] text-white placeholder:text-white/20 transition-colors focus:border-white/30 focus:bg-white/[0.09] focus:outline-none"
              placeholder="Enter password"
            />
          </div>

          {error && (
            <p className="text-[13px] text-red-400">Incorrect password.</p>
          )}

          <button
            type="submit"
            className="w-full rounded-full bg-white px-6 py-2.5 text-[14px] font-medium text-[#111] transition-opacity hover:opacity-90"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
