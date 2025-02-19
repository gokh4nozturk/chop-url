import { DashboardSidebar } from '@/components/dashboard/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <DashboardSidebar />
      <div className="flex-1 min-h-dvh pt-header">
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
