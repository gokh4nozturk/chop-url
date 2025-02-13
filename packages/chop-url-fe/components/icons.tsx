import {
  CheckCircle,
  Clock,
  Copy,
  Database,
  Loader2,
  type LucideIcon,
  Plus,
  Shield,
  Trash,
  XCircle,
} from 'lucide-react';

export type Icon = LucideIcon;

export const Icons = {
  spinner: Loader2,
  trash: Trash,
  plus: Plus,
  copy: Copy,
  checkCircle: CheckCircle,
  xCircle: XCircle,
  clock: Clock,
  dns: Database,
  shield: Shield,
} as const;
