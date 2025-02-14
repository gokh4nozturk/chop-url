'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useDomainStore } from '@/lib/store/domain';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, Clock, Loader2, XCircle } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function SslStatusPage() {
  const params = useParams();
  const domainId = Number(params.id);
  const {
    domains,
    fetchDomains,
    requestSsl,
    checkSslStatus,
    updateSslSettings,
  } = useDomainStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const domain = domains.find((d) => d.id === domainId);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      await fetchDomains();
      if (domain?.sslStatus === 'PENDING') {
        await checkSslStatus(domainId);
      }
    } finally {
      setIsLoading(false);
    }
  }, [domainId, domain?.sslStatus, fetchDomains, checkSslStatus]);

  useEffect(() => {
    fetchData();
    // Poll SSL status every 10 seconds if pending
    let interval: NodeJS.Timeout;
    if (domain?.sslStatus === 'PENDING') {
      interval = setInterval(() => {
        checkSslStatus(domainId);
      }, 10000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [domainId, domain?.sslStatus, checkSslStatus, fetchData]);

  const handleRequestSsl = async () => {
    try {
      setIsRequesting(true);
      await requestSsl(domainId);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleForceSSLToggle = async () => {
    try {
      setIsUpdating(true);
      await updateSslSettings(domainId, {
        forceSSL: !(domain?.settings?.forceSSL ?? false),
      });
    } finally {
      setIsUpdating(false);
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
                        {domain.sslStatus === 'ACTIVE' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : domain.sslStatus === 'PENDING' ? (
                          <Clock className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span
                          className={
                            domain.sslStatus === 'ACTIVE'
                              ? 'text-green-500'
                              : domain.sslStatus === 'PENDING'
                                ? 'text-yellow-500'
                                : 'text-red-500'
                          }
                        >
                          {domain.sslStatus}
                        </span>
                      </div>
                    </div>
                    {domain.sslStatus !== 'ACTIVE' && (
                      <Button
                        onClick={handleRequestSsl}
                        disabled={
                          isRequesting || domain.sslStatus === 'PENDING'
                        }
                      >
                        {isRequesting && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Request SSL Certificate
                      </Button>
                    )}
                  </div>

                  {domain.sslStatus === 'ACTIVE' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Force SSL</p>
                          <p className="text-sm text-muted-foreground">
                            Always redirect HTTP to HTTPS
                          </p>
                        </div>
                        <Switch
                          checked={domain.settings?.forceSSL ?? false}
                          onCheckedChange={handleForceSSLToggle}
                          disabled={isUpdating}
                        />
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-medium">Provider</p>
                        <p className="text-sm text-muted-foreground">
                          Cloudflare
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-medium">Type</p>
                        <p className="text-sm text-muted-foreground">
                          {domain.settings?.redirectMode || 'PROXY'}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </>
            ) : (
              <Alert>
                <AlertDescription>Domain not found</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
