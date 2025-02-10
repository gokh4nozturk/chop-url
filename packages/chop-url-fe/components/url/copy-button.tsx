'use client';

import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

interface CopyButtonProps {
  url: string;
}

export function CopyButton({ url }: CopyButtonProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('URL kopyalandı!');
    } catch (error) {
      toast.error('URL kopyalanırken bir hata oluştu.');
    }
  };

  return (
    <Button variant="outline" size="icon" onClick={handleCopy}>
      <Copy className="h-4 w-4" />
    </Button>
  );
}
