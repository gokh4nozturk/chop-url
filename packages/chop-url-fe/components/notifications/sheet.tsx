import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAuth } from '@/lib/auth-context';
import { Bell, Construction } from 'lucide-react';

export function NotificationsSheet() {
  const { user } = useAuth();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          disabled={!user}
          variant="ghost"
          size="icon"
          className="w-9 h-9"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>Manage your notifications here.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col items-center justify-center h-[80%] space-y-4">
          <Construction className="size-16 text-muted-foreground animate-pulse" />
          <div className="text-center space-y-2">
            <h3 className="font-semibold">Coming Soon!</h3>
            <p className="text-sm text-muted-foreground">
              We are working hard to bring you a great notification experience.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
