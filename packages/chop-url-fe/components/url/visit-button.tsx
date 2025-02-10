'use client';

import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface VisitButtonProps {
  url: string;
}

export function VisitButton({ url }: VisitButtonProps) {
  const handleVisit = () => {
    window.open(url, '_blank');
  };

  return (
    <Button variant="outline" size="icon" onClick={handleVisit}>
      <ExternalLink className="h-4 w-4" />
    </Button>
  );
}
