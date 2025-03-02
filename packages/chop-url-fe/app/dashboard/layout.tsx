import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { FeedbackDialog } from '@/components/feedback/FeedbackDialog';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <DashboardSidebar />
      <div className="flex-1 min-h-dvh pt-header relative">
        <main className="p-6">{children}</main>
        <FeedbackDialog />
      </div>
    </div>
  );
}
