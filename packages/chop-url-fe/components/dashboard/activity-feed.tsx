import { ScrollArea } from '@/components/ui/scroll-area';
import { Event } from '@/lib/store/analytics';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Activity,
  BarChart,
  Clock,
  Globe2,
  LucideIcon,
  MousePointer2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Animation variants for consistent animations
const containerAnimation = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const itemAnimation = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
};

const iconAnimation = {
  hover: { scale: 1.1 },
  tap: { scale: 0.95 },
};

interface ActivityFeedProps {
  events: Event[];
  className?: string;
}

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  timestamp: string;
  color: string;
}

const processEvent = (event: Event): ActivityItem => {
  const getEventIcon = (): LucideIcon => {
    switch (event.eventType) {
      case 'CLICK':
        return MousePointer2;
      case 'PAGE_VIEW':
        return Globe2;
      case 'CONVERSION':
        return Activity;
      default:
        return BarChart;
    }
  };

  const getEventColor = (): string => {
    switch (event.eventType) {
      case 'CLICK':
        return 'text-gray-500';
      case 'PAGE_VIEW':
        return 'text-green-500';
      case 'CONVERSION':
        return 'text-purple-500';
      default:
        return 'text-blue-500';
    }
  };

  const getEventDescription = (): string => {
    try {
      if (event.deviceInfo) {
        const deviceInfo = JSON.parse(event.deviceInfo);
        return `from ${deviceInfo.browser} on ${deviceInfo.deviceType}`;
      }
      return 'from unknown device';
    } catch {
      return 'from unknown device';
    }
  };

  return {
    id: event.id.toString(),
    title: event.eventType.toLowerCase(),
    description: getEventDescription(),
    icon: getEventIcon(),
    timestamp: new Date(event.createdAt).toLocaleTimeString(),
    color: getEventColor(),
  };
};

export function ActivityFeed({ events, className }: ActivityFeedProps) {
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);

  useEffect(() => {
    // Sort all events by timestamp before processing
    const sortedEvents = [...events].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const processedEvents = sortedEvents.slice(0, 10).map(processEvent);

    setActivityItems(processedEvents);
  }, [events]);

  if (events.length === 0) {
    return (
      <motion.div
        variants={containerAnimation}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.5 }}
        className="text-center py-10"
      >
        <div className="space-y-2">
          <motion.div
            variants={iconAnimation}
            whileHover="hover"
            whileTap="tap"
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <BarChart className="h-8 w-8 mx-auto text-blue-500" />
          </motion.div>
          <h3 className="text-lg font-semibold">No recent activity</h3>
          <p className="text-sm text-muted-foreground">
            Activity will appear here when your links are clicked.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <ScrollArea className={cn('h-[300px] pr-4', className)}>
      <motion.div
        variants={containerAnimation}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {activityItems.map((item, index) => (
          <motion.div
            key={item.title + item.id}
            variants={itemAnimation}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <motion.div
              variants={iconAnimation}
              whileHover="hover"
              whileTap="tap"
              className={cn('p-2 rounded-full bg-background', item.color)}
            >
              <item.icon className="w-4 h-4" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium capitalize">{item.title}</p>
              <p className="text-xs text-muted-foreground truncate">
                {item.description}
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
              <Clock className="w-3 h-3" />
              {item.timestamp}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </ScrollArea>
  );
}
