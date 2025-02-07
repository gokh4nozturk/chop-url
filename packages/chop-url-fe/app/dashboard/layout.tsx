import { Sidebar } from '@/components/dashboard/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen gap-4 mt-header">
      <Sidebar />
      <div className="max-h-[calc(100vh-5rem] w-full">
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
