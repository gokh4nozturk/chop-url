import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type GradientButtonProps = {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  props?: React.ButtonHTMLAttributes<HTMLButtonElement>;
};

function GradientButton({
  children,
  className,
  disabled,
  type = 'button',
  props,
}: GradientButtonProps) {
  return (
    <Button
      disabled={disabled}
      type={type}
      {...props}
      className={cn(
        'text-sm font-semibold relative overflow-hidden transition-all duration-300 animate-gradient',
        'bg-gradient-to-r from-foreground from-40% to-foreground to-60% bg-[length:200%_100%]',
        'hover:shadow-[0_0_20px_rgba(255,0,128,0.4)] hover:scale-[1.01] active:scale-[0.99]',
        'flex items-center gap-2',
        className
      )}
    >
      {children}
    </Button>
  );
}

export default GradientButton;
