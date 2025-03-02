import { FeedbackDialog } from '../feedback/FeedbackDialog';

export function Navbar() {
  return (
    <nav className="border-b">
      <div className="container flex h-16 items-center px-4">
        <MainNav />
        <div className="ml-auto flex items-center space-x-4">
          <FeedbackDialog />
          <UserNav />
        </div>
      </div>
    </nav>
  );
}
