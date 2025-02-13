'use client';

import { Icons } from '@/components/icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import apiClient from '@/lib/api/client';
import { ApiError } from '@/lib/api/error';
import { AnimatePresence, motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Domain {
  id: number;
  name: string;
  ssl: {
    status: 'pending' | 'active' | 'error';
    message?: string;
    expiresAt?: string;
    provider: string;
    type: string;
  };
}

export default function SslStatusPage() {
  const params = useParams();
  const domainId = params.id as string;
  const [domain, setDomain] = useState<Domain | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  const fetchDomain = useCallback(async () => {
    try {
      setError(null);
      const response = await apiClient.get(`/api/domains/${domainId}`);
      setDomain(response.data);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      setError(apiError.message || 'Failed to fetch domain details.');
    } finally {
      setIsLoading(false);
    }
  }, [domainId]);

  useEffect(() => {
    fetchDomain();
  }, [fetchDomain]);

  const handleRequestSsl = async () => {
    try {
      setIsRequesting(true);
      await apiClient.post(`/api/domains/${domainId}/ssl`);
      toast.success('SSL certificate requested', {
        description: 'Your SSL certificate request has been submitted.',
      });
      fetchDomain();
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast.error('Failed to request SSL certificate', {
        description: apiError.message || 'An error occurred',
      });
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-2xl font-bold tracking-tight"
        >
          SSL Status
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-muted-foreground"
        >
          Manage SSL certificates for your domain
        </motion.p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>SSL Certificate</CardTitle>
            <CardDescription>
              View and manage SSL certificate for your domain
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }, (_, i) => `ssl-skeleton-${i}`).map(
                  (key) => (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{
                        duration: 0.2,
                        delay: Number(key.split('-')[2]) * 0.1,
                      }}
                      className="h-12 rounded-lg bg-muted"
                    />
                  )
                )}
              </div>
            ) : domain ? (
              <>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Status</p>
                      <div className="flex items-center space-x-2">
                        {domain.ssl.status === 'active' ? (
                          <Icons.checkCircle className="h-4 w-4 text-green-500" />
                        ) : domain.ssl.status === 'pending' ? (
                          <Icons.clock className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <Icons.xCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span
                          className={
                            domain.ssl.status === 'active'
                              ? 'text-green-500'
                              : domain.ssl.status === 'pending'
                                ? 'text-yellow-500'
                                : 'text-red-500'
                          }
                        >
                          {domain.ssl.status.charAt(0).toUpperCase() +
                            domain.ssl.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    {domain.ssl.status !== 'active' && (
                      <Button
                        onClick={handleRequestSsl}
                        disabled={
                          isRequesting || domain.ssl.status === 'pending'
                        }
                      >
                        {isRequesting && (
                          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Request SSL Certificate
                      </Button>
                    )}
                  </div>

                  {domain.ssl.message && (
                    <Alert>
                      <AlertDescription>{domain.ssl.message}</AlertDescription>
                    </Alert>
                  )}

                  {domain.ssl.status === 'active' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Provider</p>
                        <p className="text-sm text-muted-foreground">
                          {domain.ssl.provider}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-medium">Type</p>
                        <p className="text-sm text-muted-foreground">
                          {domain.ssl.type}
                        </p>
                      </div>

                      {domain.ssl.expiresAt && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Expires</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(domain.ssl.expiresAt).toLocaleDateString(
                              'en-US',
                              {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              }
                            )}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
