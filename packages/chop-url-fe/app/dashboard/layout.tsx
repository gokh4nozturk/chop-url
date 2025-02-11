import { DashboardSidebar } from '@/components/dashboard/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen gap-4 mt-header w-full">
      <DashboardSidebar />
      <div className="flex-1">
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
