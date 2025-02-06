import {
  AlertTriangle,
  ArrowRight,
  BarChart,
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
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
  Link,
  Loader2,
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
  X,
} from 'lucide-react';

export type Icon = typeof LucideIcon;

export const Icons = {
  logo: Command,
  close: X,
  spinner: Loader2,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  trash: Trash,
  settings: Settings,
  user: User,
  arrowRight: ArrowRight,
  help: HelpCircle,
  pizza: Pizza,
  sun: SunMedium,
  moon: Moon,
  laptop: Laptop,
  gitHub: Github,
  twitter: Twitter,
  check: Check,
  warning: AlertTriangle,
  search: Search,
  bell: Bell,
  link: Link,
  plus: Plus,
  home: Home,
  barChart: BarChart,
  globe: Globe,
  copy: Copy,
  moreVertical: MoreVertical,
  creditCard: CreditCard,
  file: File,
  fileText: FileText,
  image: Image,
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
  shield: Shield,
} as const;
