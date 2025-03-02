'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useDomainStore } from '@/lib/store/domain';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Network, Plus, Shield, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

interface AddDomainForm {
  domain: string;
  redirectMode: 'PROXY' | 'REDIRECT';
  forceSSL: boolean;
}

export default function DomainsPage() {
  const router = useRouter();
  const {
    domains,
    isLoading,
    error,
    fetchDomains,
    addDomain,
    deleteDomain,
    verifyDomain,
  } = useDomainStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddDomainForm>({
    defaultValues: {
      redirectMode: 'PROXY',
      forceSSL: true,
    },
  });

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  const onSubmit = useCallback(
    async (data: AddDomainForm) => {
      try {
        await addDomain({
          domain: data.domain,
          settings: {
            redirectMode: data.redirectMode,
            forceSSL: data.forceSSL,
            customNameservers: null,
          },
        });
        reset();
      } catch (error) {
        // Error is already handled by the store
        console.error('Error adding domain:', error);
      }
    },
    [addDomain, reset]
  );

  const handleVerifyDomain = useCallback(
    (domainId: number) => {
      verifyDomain(domainId);
    },
    [verifyDomain]
  );

  const handleDeleteDomain = useCallback(
    (domainId: number) => {
      deleteDomain(domainId);
    },
    [deleteDomain]
  );

  const handleNavigate = useCallback(
    (path: string) => {
      router.push(path);
    },
    [router]
  );

  const renderDomainCard = useCallback(
    (domain: (typeof domains)[0], index: number) => {
      const settings = domain.settings || { redirectMode: 'PROXY' };

      return (
        <motion.div
          key={domain.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2, delay: index * 0.1 }}
          layout
        >
          ustunde calistigimizi belirtmek icin engineering team veya domain
          aramasi yap undrawdan bir gorsel koy
          <Card className="relative overflow-hidden">
            {!domain.isVerified && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute right-2 top-2 rounded-full bg-yellow-500 px-2 py-1 text-xs font-medium text-white"
              >
                Pending Verification
              </motion.div>
            )}
            <CardHeader>
              <CardTitle>{domain.domain}</CardTitle>
              <CardDescription>
                Added on {new Date(domain.createdAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <span
                    className={`text-sm ${
                      domain.isVerified ? 'text-green-500' : 'text-yellow-500'
                    }`}
                  >
                    {domain.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">SSL</span>
                  <span
                    className={`text-sm ${
                      domain.sslStatus === 'ACTIVE'
                        ? 'text-green-500'
                        : domain.sslStatus === 'PENDING'
                          ? 'text-yellow-500'
                          : 'text-red-500'
                    }`}
                  >
                    {domain.sslStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Mode</span>
                  <span className="text-sm">{settings.redirectMode}</span>
                </div>
              </div>

              <div className="flex gap-2">
                {!domain.isVerified && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleVerifyDomain(domain.id)}
                  >
                    Verify
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleNavigate(`/dashboard/domains/${domain.id}/dns`)
                  }
                >
                  <Network className="mr-2 h-4 w-4" />
                  DNS Records
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleNavigate(`/dashboard/domains/${domain.id}/ssl`)
                  }
                >
                  <Shield className="mr-2 h-4 w-4" />
                  SSL
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteDomain(domain.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      );
    },
    [handleDeleteDomain, handleNavigate, handleVerifyDomain]
  );

  const skeletons = useMemo(
    () =>
      Array.from({ length: 3 }, (_, i) => `domain-skeleton-${i}`).map((key) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{
            duration: 0.2,
            delay: Number(key.split('-')[2]) * 0.1,
          }}
        >
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        </motion.div>
      )),
    []
  );

  const emptyState = useMemo(
    () => (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="col-span-full"
      >
        <Card>
          <CardHeader>
            <CardTitle>No Domains</CardTitle>
            <CardDescription>
              You haven't added any custom domains yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Click the "Add Domain" button to get started.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    ),
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 xs:flex-row xs:items-center xs:justify-between">
        <div>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-2xl font-bold tracking-tight"
          >
            Custom Domains
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground"
          >
            Manage your custom domains and DNS settings
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Dialog>
            <DialogTrigger asChild>
              <Button disabled>
                <Plus className="mr-2 h-4 w-4" />
                Add Domain
              </Button>
            </DialogTrigger>
          </Dialog>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="relative grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md border-none bg-transparent shadow-none">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Coming Soon</CardTitle>
              <CardDescription>
                Custom domains feature will be available in the next release.
                Stay tuned!
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <img
                src="https://illustrations.popsy.co/amber/web-development.svg"
                alt="Coming Soon"
                className="max-w-[300px]"
              />
            </CardContent>
          </Card>
        </div>

        <AnimatePresence mode="popLayout">
          {isLoading
            ? skeletons
            : domains.length === 0
              ? emptyState
              : domains.map(renderDomainCard)}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
