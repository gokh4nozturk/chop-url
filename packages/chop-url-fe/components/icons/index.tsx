import {
  AlertTriangle,
  ArrowRight,
  BarChart,
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Command,
  Copy,
  CreditCard,
  File,
  FileText,
  Github,
  Globe,
  HelpCircle,
  Home,
  type Icon as LucideIcon,
  Image,
  Laptop,
  LayoutDashboard,
  Link,
  Link2,
  Loader2,
  LogOut,
  LucideProps,
  Mail,
  Moon,
  MoreVertical,
  Pizza,
  Plus,
  Search,
  Settings,
  Shield,
  SunMedium,
  Trash,
  Twitter,
  User,
  User2,
  X,
} from 'lucide-react';

import { FrameIcon } from './frame';

export type Icon = typeof LucideIcon | typeof FrameIcon;

export const Icons = {
  command: Command,
  close: X,
  spinner: Loader2,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  trash: Trash,
  user: User,
  user2: User2,
  fileText: FileText,
  file: File,
  image: Image,
  settings: Settings,
  creditCard: CreditCard,
  moreVertical: MoreVertical,
  plus: Plus,
  alertTriangle: AlertTriangle,
  helpCircle: HelpCircle,
  pizza: Pizza,
  sunMedium: SunMedium,
  moon: Moon,
  laptop: Laptop,
  gitHub: Github,
  twitter: Twitter,
  check: Check,
  link: Link,
  link2: Link2,
  copy: Copy,
  chevronUpDown: ChevronsUpDown,
  shield: Shield,
  bell: Bell,
  home: Home,
  search: Search,
  globe: Globe,
  logout: LogOut,
  barChart: BarChart,
  arrowRight: ArrowRight,
  mail: Mail,
  layoutDashboard: LayoutDashboard,
  google: ({ ...props }: LucideProps) => (
    <svg
      aria-hidden="true"
      focusable="false"
      data-prefix="fab"
      data-icon="google"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 488 512"
      {...props}
    >
      <path
        fill="currentColor"
        d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
      />
    </svg>
  ),
  frame: FrameIcon,
} as const;
