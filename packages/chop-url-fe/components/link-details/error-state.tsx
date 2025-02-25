'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface IUrlError {
  code: string;
  message: string;
}

export const ErrorState = ({ error }: { error: IUrlError }) => {
  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">Error: {error.code}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{error.message}</p>
      </CardContent>
    </Card>
  );
};
