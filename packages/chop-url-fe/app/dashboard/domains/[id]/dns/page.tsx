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
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface DnsRecord {
  id: number;
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX' | 'NS';
  name: string;
  content: string;
  ttl: number;
  priority?: number;
  proxied: boolean;
  createdAt: string;
}

interface AddDnsRecordForm {
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX' | 'NS';
  name: string;
  content: string;
  ttl: number;
  priority?: number;
  proxied: boolean;
}

export default function DnsRecordsPage() {
  const params = useParams();
  const domainId = params.id as string;
  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingRecord, setIsAddingRecord] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AddDnsRecordForm>({
    defaultValues: {
      ttl: 3600,
      proxied: false,
    },
  });

  const recordType = watch('type');

  const fetchRecords = useCallback(async () => {
    try {
      setError(null);
      const response = await apiClient.get(`/api/domains/${domainId}/dns`);
      setRecords(response.data);
    } catch (error) {
      console.error('Error fetching DNS records:', error);
      setError('Failed to fetch DNS records. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [domainId]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const onSubmit = async (data: AddDnsRecordForm) => {
    try {
      setIsAddingRecord(true);
      await apiClient.post(`/api/domains/${domainId}/dns`, data);

      toast.success('DNS record added', {
        description: 'Your DNS record has been added successfully.',
      });

      reset();
      fetchRecords();
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast.error('Failed to add DNS record', {
        description: apiError.message || 'An error occurred',
      });
    } finally {
      setIsAddingRecord(false);
    }
  };

  const handleDeleteRecord = async (recordId: number) => {
    try {
      await apiClient.delete(`/api/domains/${domainId}/dns/${recordId}`);
      toast.success('DNS record deleted', {
        description: 'Your DNS record has been deleted successfully.',
      });
      fetchRecords();
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast.error('Failed to delete DNS record', {
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
            DNS Records
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground"
          >
            Manage DNS records for your domain
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
                Add Record
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add DNS Record</DialogTitle>
                <DialogDescription>
                  Add a new DNS record to your domain.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Record Type</Label>
                  <Select {...register('type')} defaultValue="A">
                    <SelectTrigger>
                      <SelectValue placeholder="Select record type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A Record</SelectItem>
                      <SelectItem value="AAAA">AAAA Record</SelectItem>
                      <SelectItem value="CNAME">CNAME Record</SelectItem>
                      <SelectItem value="TXT">TXT Record</SelectItem>
                      <SelectItem value="MX">MX Record</SelectItem>
                      <SelectItem value="NS">NS Record</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="@"
                    {...register('name', { required: true })}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">Name is required</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Input
                    id="content"
                    placeholder={
                      recordType === 'A'
                        ? '192.0.2.1'
                        : recordType === 'AAAA'
                          ? '2001:db8::1'
                          : recordType === 'CNAME'
                            ? 'example.com'
                            : recordType === 'TXT'
                              ? 'v=spf1 include:_spf.example.com ~all'
                              : recordType === 'MX'
                                ? 'mail.example.com'
                                : 'ns1.example.com'
                    }
                    {...register('content', { required: true })}
                  />
                  {errors.content && (
                    <p className="text-sm text-destructive">
                      Content is required
                    </p>
                  )}
                </div>

                {recordType === 'MX' && (
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Input
                      id="priority"
                      type="number"
                      placeholder="10"
                      {...register('priority', {
                        valueAsNumber: true,
                        min: 0,
                        max: 65535,
                      })}
                    />
                    {errors.priority && (
                      <p className="text-sm text-destructive">
                        Priority must be between 0 and 65535
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="ttl">TTL (seconds)</Label>
                  <Input
                    id="ttl"
                    type="number"
                    {...register('ttl', {
                      valueAsNumber: true,
                      min: 60,
                      max: 86400,
                    })}
                  />
                  {errors.ttl && (
                    <p className="text-sm text-destructive">
                      TTL must be between 60 and 86400 seconds
                    </p>
                  )}
                </div>

                {(recordType === 'A' ||
                  recordType === 'AAAA' ||
                  recordType === 'CNAME') && (
                  <div className="flex items-center space-x-2">
                    <Switch id="proxied" {...register('proxied')} />
                    <Label htmlFor="proxied">Proxy through Cloudflare</Label>
                  </div>
                )}

                <DialogFooter>
                  <Button type="submit" disabled={isAddingRecord}>
                    {isAddingRecord && (
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Add Record
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
      >
        <Card>
          <CardHeader>
            <CardTitle>DNS Records</CardTitle>
            <CardDescription>
              Manage your domain's DNS records. Changes may take up to 24 hours
              to propagate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {isLoading ? (
                  // Loading skeletons
                  Array.from({ length: 3 }, (_, i) => `dns-skeleton-${i}`).map(
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
                        className="flex items-center justify-between space-x-4 rounded-lg border p-4"
                      >
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-8 w-8" />
                      </motion.div>
                    )
                  )
                ) : records.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-lg border p-8 text-center"
                  >
                    <p className="text-sm text-muted-foreground">
                      No DNS records found. Click "Add Record" to create one.
                    </p>
                  </motion.div>
                ) : (
                  records.map((record, index) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2, delay: index * 0.1 }}
                      layout
                      className="flex items-center justify-between space-x-4 rounded-lg border p-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="rounded bg-primary/10 px-2 py-1 text-xs font-medium">
                            {record.type}
                          </span>
                          <span className="text-sm font-medium">
                            {record.name}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {record.content}
                          {record.priority !== undefined &&
                            ` (Priority: ${record.priority})`}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span>TTL: {record.ttl}s</span>
                          {record.proxied && (
                            <span className="rounded bg-orange-500/10 px-2 py-0.5 text-orange-500">
                              Proxied
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRecord(record.id)}
                      >
                        <Icons.trash className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
