'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { logoutAction } from '@/lib/actions';

interface NavItem {
  href: string;
  label: string;
}

const CONTENT_NAV: NavItem[] = [
  { href: '/admin/projects',   label: 'Projects' },
  { href: '/admin/writing',    label: 'Writing' },
  { href: '/admin/research',   label: 'Research' },
  { href: '/admin/experience', label: 'Experience' },
];

const SYSTEM_NAV: NavItem[] = [
  { href: '/admin/settings',   label: 'Settings' },
  { href: '/admin/ai',         label: 'AI Workspace' },
  { href: '/admin/observability', label: 'Observability' },
];

function NavLink({ href, label }: NavItem) {
  const pathname = usePathname();
  const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={[
        'flex items-center rounded-md px-3 py-[7px] text-[13px] transition-colors duration-100',
        active
          ? 'bg-white/[0.09] font-medium text-white'
          : 'text-white/50 hover:bg-white/[0.05] hover:text-white/80',
      ].join(' ')}
    >
      {label}
    </Link>
  );
}

function DashboardLink() {
  const pathname = usePathname();
  const active = pathname === '/admin';

  return (
    <Link
      href="/admin"
      className={[
        'flex items-center rounded-md px-3 py-[7px] text-[13px] transition-colors duration-100',
        active
          ? 'bg-white/[0.09] font-medium text-white'
          : 'text-white/50 hover:bg-white/[0.05] hover:text-white/80',
      ].join(' ')}
    >
      Dashboard
    </Link>
  );
}

export default function AdminSidebar() {
  return (
    <aside className="flex h-full w-[220px] flex-none flex-col bg-ink">

      {/* Wordmark */}
      <div className="px-5 pb-4 pt-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/25">
          Portfolio
        </p>
        <p className="mt-0.5 text-[15px] font-semibold tracking-[-0.015em] text-white">
          Swethank OS
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">

        {/* Overview */}
        <div className="mb-4">
          <DashboardLink />
        </div>

        {/* Content */}
        <div className="mb-4">
          <p className="mb-1.5 px-3 text-[10px] font-medium uppercase tracking-[0.12em] text-white/22">
            Content
          </p>
          <div className="space-y-0.5">
            {CONTENT_NAV.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </div>
        </div>

        {/* System */}
        <div>
          <p className="mb-1.5 px-3 text-[10px] font-medium uppercase tracking-[0.12em] text-white/22">
            System
          </p>
          <div className="space-y-0.5">
            {SYSTEM_NAV.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/[0.07] px-3 py-4 space-y-0.5">
        <Link
          href="/"
          className="flex items-center rounded-md px-3 py-[7px] text-[13px] text-white/40 hover:text-white/70 transition-colors duration-100"
        >
          ← Portfolio
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full rounded-md px-3 py-[7px] text-left text-[13px] text-white/40 hover:text-white/70 transition-colors duration-100"
          >
            Sign out
          </button>
        </form>
      </div>

    </aside>
  );
}
