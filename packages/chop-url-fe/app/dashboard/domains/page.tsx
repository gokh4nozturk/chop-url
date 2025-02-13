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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import apiClient from '@/lib/api/client';
import { ApiError } from '@/lib/api/error';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface Domain {
  id: number;
  domain: string;
  isVerified: boolean;
  verificationToken: string;
  verificationMethod: 'DNS_TXT' | 'DNS_CNAME' | 'FILE';
  sslStatus: 'PENDING' | 'ACTIVE' | 'FAILED';
  isActive: boolean;
  createdAt: string;
  settings: {
    redirectMode: 'PROXY' | 'REDIRECT';
    customNameservers: string | null;
    forceSSL: boolean;
  };
}

interface AddDomainForm {
  domain: string;
  redirectMode: 'PROXY' | 'REDIRECT';
  forceSSL: boolean;
}

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddDomainForm>({
    defaultValues: {
      redirectMode: 'PROXY',
      forceSSL: true,
    },
  });

  const fetchDomains = useCallback(async () => {
    try {
      setError(null);
      const response = await apiClient.get('/api/domains');
      setDomains(response.data);
    } catch (error) {
      console.error('Error fetching domains:', error);
      setError('Failed to fetch domains. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  const onSubmit = async (data: AddDomainForm) => {
    try {
      setIsAddingDomain(true);
      await apiClient.post('/api/domains', {
        domain: data.domain,
        settings: {
          redirectMode: data.redirectMode,
          forceSSL: data.forceSSL,
        },
      });

      toast.success('Domain added successfully', {
        description: 'Your domain has been added and is pending verification.',
      });

      reset();
      fetchDomains();
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast.error('Failed to add domain', {
        description: apiError.message || 'An error occurred',
      });
    } finally {
      setIsAddingDomain(false);
    }
  };

  const handleVerifyDomain = async (domainId: number) => {
    try {
      const response = await apiClient.post(`/api/domains/${domainId}/verify`);
      if (response.data.verified) {
        toast.success('Domain verified', {
          description: 'Your domain has been verified successfully.',
        });
        fetchDomains();
      } else {
        toast.error('Verification failed', {
          description: 'Please check your DNS settings and try again.',
        });
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast.error('Verification failed', {
        description: apiError.message || 'An error occurred',
      });
    }
  };

  const handleDeleteDomain = async (domainId: number) => {
    try {
      await apiClient.delete(`/api/domains/${domainId}`);
      toast.success('Domain deleted', {
        description: 'Your domain has been deleted successfully.',
      });
      fetchDomains();
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast.error('Failed to delete domain', {
        description: apiError.message || 'An error occurred',
      });
    }
  };

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
              <Button>
                <Icons.plus className="mr-2 h-4 w-4" />
                Add Domain
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Custom Domain</DialogTitle>
                <DialogDescription>
                  Add your domain to start using it with ChopURL.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain Name</Label>
                  <Input
                    id="domain"
                    placeholder="example.com"
                    {...register('domain', { required: true })}
                  />
                  {errors.domain && (
                    <p className="text-sm text-destructive">
                      Domain name is required
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="redirectMode">Redirect Mode</Label>
                  <Select {...register('redirectMode')} defaultValue="PROXY">
                    <SelectTrigger>
                      <SelectValue placeholder="Select redirect mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PROXY">Proxy (Recommended)</SelectItem>
                      <SelectItem value="REDIRECT">Direct Redirect</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="forceSSL"
                    {...register('forceSSL')}
                    defaultChecked
                  />
                  <Label htmlFor="forceSSL">Force SSL</Label>
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={isAddingDomain}>
                    {isAddingDomain && (
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Add Domain
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>
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
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 3 }, (_, i) => `domain-skeleton-${i}`).map(
              (key) => (
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
              )
            )
          ) : domains.length === 0 ? (
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
          ) : (
            domains.map((domain, index) => (
              <motion.div
                key={domain.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: index * 0.1 }}
                layout
              >
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
                            domain.isVerified
                              ? 'text-green-500'
                              : 'text-yellow-500'
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
                        <span className="text-sm">
                          {domain.settings.redirectMode}
                        </span>
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
                          router.push(`/dashboard/domains/${domain.id}/dns`)
                        }
                      >
                        <Icons.network className="mr-2 h-4 w-4" />
                        DNS Records
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/dashboard/domains/${domain.id}/ssl`)
                        }
                      >
                        <Icons.shield className="mr-2 h-4 w-4" />
                        SSL
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDomain(domain.id)}
                      >
                        <Icons.trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
