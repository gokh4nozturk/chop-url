import { cn } from '@/lib/utils';

function GradientText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-block bg-clip-text text-transparent bg-300% animate-gradient',
        'bg-gradient-to-r from-[#FF0080] via-[#7928CA] to-[#FF0080]',
        'font-black',
        className
      )}
    >
      {children}
    </span>
  );
}

export default GradientText;
