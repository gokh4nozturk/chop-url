import { StatCard } from '@/components/ui/stat-card';
import { LucideIcon } from 'lucide-react';

interface StatData {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
}

interface StatGroupProps {
  stats: StatData[];
  loading?: boolean;
  className?: string;
}

export function StatGroup({
  stats,
  loading = false,
  className = '',
}: StatGroupProps) {
  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {stats.map((stat, index) => (
        <StatCard
          key={`${stat.title}-${index}`}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          loading={loading}
          subtitle={stat.subtitle}
        />
      ))}
    </div>
  );
}
