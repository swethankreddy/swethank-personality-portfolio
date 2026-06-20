import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/auth';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect('/admin/login');

  return (
    <div className="flex h-dvh bg-[#f4f4f4]">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto bg-white">
        {children}
      </main>
    </div>
  );
}
