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
import { useDomainStore } from '@/lib/store/domain';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Trash } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

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
  const domainId = Number(params.id);
  const { dnsRecords, fetchDnsRecords, addDnsRecord, deleteDnsRecord } =
    useDomainStore();
  const records = dnsRecords[domainId] || [];

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

  useEffect(() => {
    fetchDnsRecords(domainId);
  }, [fetchDnsRecords, domainId]);

  const onSubmit = async (data: AddDnsRecordForm) => {
    try {
      await addDnsRecord(domainId, data);
      reset();
    } catch (error) {
      // Error is already handled by the store
      console.error('Error adding DNS record:', error);
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
                <Plus className="mr-2 h-4 w-4" />
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
                        required: true,
                      })}
                    />
                    {errors.priority && (
                      <p className="text-sm text-destructive">
                        Priority is required for MX records
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
                      required: true,
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

                {(recordType === 'A' || recordType === 'AAAA') && (
                  <div className="flex items-center space-x-2">
                    <Switch id="proxied" {...register('proxied')} />
                    <Label htmlFor="proxied">Proxy through Cloudflare</Label>
                  </div>
                )}

                <Button type="submit" className="w-full">
                  Add Record
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>

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
                {!records ? (
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="rounded-lg border p-4 text-center"
                  >
                    <p className="text-sm text-muted-foreground">
                      No DNS records found. Click the "Add Record" button to get
                      started.
                    </p>
                  </motion.div>
                ) : (
                  records.map((record, index) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{
                        duration: 0.2,
                        delay: index * 0.1,
                      }}
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
                        onClick={() => deleteDnsRecord(domainId, record.id)}
                      >
                        <Trash className="h-4 w-4" />
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
