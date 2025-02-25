'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDomainStore } from '@/lib/store/domain';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Copy,
  ExternalLink,
  HelpCircle,
  Info,
  Loader2,
  Plus,
  RefreshCw,
  Trash,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

// DNS record type descriptions
const DNS_RECORD_DESCRIPTIONS = {
  A: 'Points to an IPv4 address. Example: 192.168.1.1',
  AAAA: 'Points to an IPv6 address. Example: 2001:0db8:85a3:0000:0000:8a2e:0370:7334',
  CNAME: 'Points to another domain name. Example: example.com',
  TXT: 'Stores text information. Used for domain verification.',
  MX: 'Specifies mail servers. Requires priority value.',
  NS: 'Specifies authoritative name servers for the domain.',
};

// Templates for common DNS configurations
const DNS_TEMPLATES = [
  {
    name: 'Standard Website',
    records: [
      {
        type: 'A' as const,
        name: '@',
        content: '192.0.2.1',
        ttl: 3600,
        proxied: true,
      },
      {
        type: 'CNAME' as const,
        name: 'www',
        content: '@',
        ttl: 3600,
        proxied: true,
      },
    ],
  },
  {
    name: 'Email Configuration',
    records: [
      {
        type: 'MX' as const,
        name: '@',
        content: 'mail.example.com',
        ttl: 3600,
        priority: 10,
        proxied: false,
      },
      {
        type: 'TXT' as const,
        name: '@',
        content: 'v=spf1 include:_spf.example.com ~all',
        ttl: 3600,
        proxied: false,
      },
    ],
  },
];

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
  const {
    domains,
    dnsRecords,
    fetchDomains,
    fetchDnsRecords,
    addDnsRecord,
    deleteDnsRecord,
  } = useDomainStore();
  const records = dnsRecords[domainId] || [];
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);

  const domain = domains.find((d) => d.id === domainId);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AddDnsRecordForm>({
    defaultValues: {
      ttl: 3600,
      proxied: false,
    },
  });

  const recordType = watch('type');

  useEffect(() => {
    fetchDomains();
    fetchDnsRecords(domainId);
  }, [fetchDomains, fetchDnsRecords, domainId]);

  const onSubmit = async (data: AddDnsRecordForm) => {
    try {
      await addDnsRecord(domainId, data);
      reset();
    } catch (error) {
      // Error is already handled by the store
      console.error('Error adding DNS record:', error);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await fetchDnsRecords(domainId);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleApplyTemplate = async (templateName: string) => {
    const template = DNS_TEMPLATES.find((t) => t.name === templateName);
    if (!template) return;

    // Şablondaki kayıtları ekle
    for (const record of template.records) {
      try {
        await addDnsRecord(domainId, {
          type: record.type,
          name: record.name,
          content: record.content,
          ttl: record.ttl,
          priority: 'priority' in record ? record.priority : undefined,
          proxied: record.proxied,
        });
      } catch (error) {
        console.error(`Error adding template record: ${error}`);
      }
    }

    setShowTemplateDialog(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // DNS kayıtlarını tipine göre grupla
  const groupedRecords = records.reduce(
    (acc, record) => {
      if (!acc[record.type]) {
        acc[record.type] = [];
      }
      acc[record.type].push(record);
      return acc;
    },
    {} as Record<string, typeof records>
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
            DNS Records
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground"
          >
            Manage DNS records for {domain?.domain}
          </motion.p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTemplateDialog(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Apply Template
          </Button>
        </div>
      </div>

      {/* DNS Kayıt Ekleme Kartı */}
      <Card>
        <CardHeader>
          <CardTitle>Add DNS Record</CardTitle>
          <CardDescription>Add a new DNS record for the domain</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">
                  Record Type
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="ml-1 h-4 w-4 inline-block text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p>
                          Different DNS record types serve different purposes.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Select
                  onValueChange={(
                    value: 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX' | 'NS'
                  ) => setValue('type', value)}
                  defaultValue="A"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select record type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A (IPv4 Address)</SelectItem>
                    <SelectItem value="AAAA">AAAA (IPv6 Address)</SelectItem>
                    <SelectItem value="CNAME">
                      CNAME (Canonical Name)
                    </SelectItem>
                    <SelectItem value="TXT">TXT (Text)</SelectItem>
                    <SelectItem value="MX">MX (Mail Exchange)</SelectItem>
                    <SelectItem value="NS">NS (Name Server)</SelectItem>
                  </SelectContent>
                </Select>
                {recordType && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {DNS_RECORD_DESCRIPTIONS[recordType]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  Name
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="ml-1 h-4 w-4 inline-block text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p>
                          Use @ for the root domain. For subdomains, just write
                          the subdomain name (e.g., www).
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="name"
                  placeholder="@ or subdomain"
                  {...register('name', { required: true })}
                />
                {errors.name && (
                  <p className="text-xs text-red-500">Name is required</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">
                  Content
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="ml-1 h-4 w-4 inline-block text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p>
                          IP address for A record, domain name for CNAME, etc.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="content"
                  placeholder={
                    recordType === 'A'
                      ? '192.168.1.1'
                      : recordType === 'AAAA'
                        ? '2001:0db8:85a3:0000:0000:8a2e:0370:7334'
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
                  <p className="text-xs text-red-500">Content is required</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ttl">
                  TTL (Seconds)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="ml-1 h-4 w-4 inline-block text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p>
                          Time To Live - How long the DNS record should be
                          cached. Lower values allow for faster updates.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="ttl"
                  type="number"
                  {...register('ttl', { required: true, min: 60 })}
                />
                {errors.ttl && (
                  <p className="text-xs text-red-500">
                    TTL must be at least 60 seconds
                  </p>
                )}
              </div>

              {recordType === 'MX' && (
                <div className="space-y-2">
                  <Label htmlFor="priority">
                    Priority
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="ml-1 h-4 w-4 inline-block text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p>
                            Lower values indicate higher priority. Use 10 for
                            primary mail server, 20 for backup, etc.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    id="priority"
                    type="number"
                    {...register('priority', {
                      required: recordType === 'MX',
                      min: 0,
                    })}
                  />
                  {errors.priority && (
                    <p className="text-xs text-red-500">
                      Priority is required for MX records
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="proxied">
                    Cloudflare Proxy
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="ml-1 h-4 w-4 inline-block text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p>
                            When enabled, traffic passes through Cloudflare and
                            enables DDoS protection, SSL, and other Cloudflare
                            features.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Switch
                    id="proxied"
                    {...register('proxied')}
                    disabled={['MX', 'NS', 'TXT'].includes(recordType || '')}
                  />
                </div>
                {['MX', 'NS', 'TXT'].includes(recordType || '') && (
                  <p className="text-xs text-muted-foreground">
                    Proxy cannot be used for this record type
                  </p>
                )}
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Add Record
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* DNS Kayıtları Listesi */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Records</TabsTrigger>
          {Object.keys(groupedRecords).map((type) => (
            <TabsTrigger key={type} value={type}>
              {type} ({groupedRecords[type].length})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all">
          {records.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">
                  No DNS records yet. Use the form above to add records.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {records.map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <Badge variant="outline" className="mr-2">
                              {record.type}
                            </Badge>
                            <h4 className="font-medium">
                              {record.name === '@'
                                ? domain?.domain
                                : `${record.name}.${domain?.domain}`}
                            </h4>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 ml-2"
                              onClick={() =>
                                copyToClipboard(
                                  record.name === '@'
                                    ? domain?.domain || ''
                                    : `${record.name}.${domain?.domain}`
                                )
                              }
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <span>Content: {record.content}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 ml-1"
                              onClick={() => copyToClipboard(record.content)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                            <span>TTL: {record.ttl}</span>
                            {record.priority !== undefined && (
                              <span>Priority: {record.priority}</span>
                            )}
                            <span>
                              Proxy: {record.proxied ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => deleteDnsRecord(domainId, record.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {Object.entries(groupedRecords).map(([type, typeRecords]) => (
          <TabsContent key={type} value={type}>
            <div className="space-y-4">
              {typeRecords.map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <h4 className="font-medium">
                              {record.name === '@'
                                ? domain?.domain
                                : `${record.name}.${domain?.domain}`}
                            </h4>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 ml-2"
                              onClick={() =>
                                copyToClipboard(
                                  record.name === '@'
                                    ? domain?.domain || ''
                                    : `${record.name}.${domain?.domain}`
                                )
                              }
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <span>Content: {record.content}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 ml-1"
                              onClick={() => copyToClipboard(record.content)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                            <span>TTL: {record.ttl}</span>
                            {record.priority !== undefined && (
                              <span>Priority: {record.priority}</span>
                            )}
                            <span>
                              Proxy: {record.proxied ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => deleteDnsRecord(domainId, record.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* DNS Şablonları Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply DNS Template</DialogTitle>
            <DialogDescription>
              Ready-made templates for common DNS configurations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {DNS_TEMPLATES.map((template) => (
              <Card
                key={template.name}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => handleApplyTemplate(template.name)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="space-y-2">
                    {template.records.map((record, idx) => (
                      <div
                        key={`${record.type}-${record.name}-${idx}`}
                        className="text-sm flex items-center"
                      >
                        <Badge variant="outline" className="mr-2">
                          {record.type}
                        </Badge>
                        <span className="text-muted-foreground">
                          {record.name} → {record.content}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTemplateDialog(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
