import Nav from '@/components/Nav';

export const metadata = {
  title: 'About | Swethank',
  description: 'IIT Bombay. Building at the intersection of AI, research, and design.',
};

const INTERESTS = [
  'Multi-agent AI systems',
  'Computational biology',
  'Motion design',
  'Venture investing',
  'Language models',
  'Product craft',
] as const;

export default function AboutPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <Nav />
      <main className="flex-1 px-6 py-16 sm:px-10 lg:px-16 lg:py-20">
        <div className="max-w-[560px]">

          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted/50">
            About
          </p>
          <h1 className="mb-12 text-[32px] font-bold leading-[1.1] tracking-[-0.02em] text-ink">
            Swethank Reddy
          </h1>

          <div className="space-y-6 text-[17px] leading-[1.6] tracking-[-0.01em] text-muted">
            <p>
              I study at IIT Bombay, where I research computational cancer biology
              and build AI systems: RAG agents, market regime detectors, and more.
              The thread connecting the work is a preference for things that are
              both rigorous and usable.
            </p>
            <p>
              Outside research, I work as an investment analyst at AUM Ventures,
              evaluating AI and deep-tech companies. I make motion design and
              video as a separate practice. It&apos;s how I think about craft when
              code is not the medium.
            </p>
            <p>
              I&apos;m drawn to problems that sit at the edge of what&apos;s technically
              possible and what people actually need. Most of what I build tries
              to close that gap.
            </p>
          </div>

          <div className="mt-12">
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.14em] text-muted/40">
              Current interests
            </p>
            <ul className="space-y-2">
              {INTERESTS.map((interest) => (
                <li
                  key={interest}
                  className="text-[15px] leading-[1.5] tracking-[-0.01em] text-ink/70"
                >
                  {interest}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-12 pt-10 border-t border-ink/[0.07]">
            <p className="text-[13px] leading-[1.6] text-muted/50">
              IIT Bombay · Mumbai, India
            </p>
            <a
              href="mailto:swethankreddy@iitb.ac.in"
              className="mt-1 block text-[13px] text-muted/50 transition-colors duration-150 hover:text-ink"
            >
              swethankreddy@iitb.ac.in
            </a>
          </div>

        </div>
      </main>
    </div>
  );
}
