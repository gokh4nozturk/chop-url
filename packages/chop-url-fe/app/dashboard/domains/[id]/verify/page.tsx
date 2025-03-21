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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import apiClient from '@/lib/api/client';
import { ApiError } from '@/lib/api/error';
import { AnimatePresence, motion } from 'framer-motion';
import { Copy, Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
interface Domain {
  id: number;
  name: string;
  verified: boolean;
  verificationMethod?: 'DNS_TXT' | 'DNS_CNAME' | 'FILE';
  verificationToken?: string;
  verificationFile?: {
    name: string;
    content: string;
  };
  verificationDnsRecord?: {
    type: 'TXT' | 'CNAME';
    name: string;
    content: string;
  };
}

export default function DomainVerificationPage() {
  const params = useParams();
  const router = useRouter();
  const domainId = params.id as string;
  const [domain, setDomain] = useState<Domain | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchDomain = useCallback(async () => {
    try {
      setError(null);
      const response = await apiClient.get(`/domains/${domainId}`);
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

  const handleMethodChange = async (method: Domain['verificationMethod']) => {
    try {
      await apiClient.patch(`/domains/${domainId}`, {
        verificationMethod: method,
      });
      fetchDomain();
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast.error('Failed to update verification method', {
        description: apiError.message || 'An error occurred',
      });
    }
  };

  const handleVerify = async () => {
    try {
      setIsVerifying(true);
      await apiClient.post(`/domains/${domainId}/verify`);
      toast.success('Domain verified', {
        description: 'Your domain has been verified successfully.',
      });
      router.push(`/dashboard/domains/${domainId}`);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast.error('Verification failed', {
        description: apiError.message || 'An error occurred',
      });
    } finally {
      setIsVerifying(false);
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
          Verify Domain
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-muted-foreground"
        >
          Verify ownership of your domain to start using it
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
            <CardTitle>Domain Verification</CardTitle>
            <CardDescription>
              Choose a verification method and follow the instructions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from(
                  { length: 3 },
                  (_, i) => `verify-skeleton-${i}`
                ).map((key) => (
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
                ))}
              </div>
            ) : domain ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Verification Method
                  </label>
                  <Select
                    value={domain.verificationMethod}
                    onValueChange={(value: 'DNS_TXT' | 'DNS_CNAME' | 'FILE') =>
                      handleMethodChange(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a verification method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DNS_TXT">DNS TXT Record</SelectItem>
                      <SelectItem value="DNS_CNAME">
                        DNS CNAME Record
                      </SelectItem>
                      <SelectItem value="FILE">File Upload</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <AnimatePresence mode="wait">
                  {domain.verificationMethod === 'DNS_TXT' && (
                    <motion.div
                      key="dns-txt"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <Alert>
                        <AlertDescription>
                          Add the following TXT record to your domain's DNS
                          settings:
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Name</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigator.clipboard.writeText(
                                domain.verificationDnsRecord?.name || ''
                              )
                            }
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy
                          </Button>
                        </div>
                        <Input
                          readOnly
                          value={domain.verificationDnsRecord?.name}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Value</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigator.clipboard.writeText(
                                domain.verificationDnsRecord?.content || ''
                              )
                            }
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy
                          </Button>
                        </div>
                        <Input
                          readOnly
                          value={domain.verificationDnsRecord?.content}
                        />
                      </div>
                    </motion.div>
                  )}

                  {domain.verificationMethod === 'DNS_CNAME' && (
                    <motion.div
                      key="dns-cname"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <Alert>
                        <AlertDescription>
                          Add the following CNAME record to your domain's DNS
                          settings:
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Name</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigator.clipboard.writeText(
                                domain.verificationDnsRecord?.name || ''
                              )
                            }
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy
                          </Button>
                        </div>
                        <Input
                          readOnly
                          value={domain.verificationDnsRecord?.name}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Value</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigator.clipboard.writeText(
                                domain.verificationDnsRecord?.content || ''
                              )
                            }
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy
                          </Button>
                        </div>
                        <Input
                          readOnly
                          value={domain.verificationDnsRecord?.content}
                        />
                      </div>
                    </motion.div>
                  )}

                  {domain.verificationMethod === 'FILE' && (
                    <motion.div
                      key="file"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <Alert>
                        <AlertDescription>
                          Download the verification file and upload it to your
                          domain's root directory:
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">File Name</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigator.clipboard.writeText(
                                domain.verificationFile?.name || ''
                              )
                            }
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy
                          </Button>
                        </div>
                        <Input readOnly value={domain.verificationFile?.name} />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            File Content
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigator.clipboard.writeText(
                                domain.verificationFile?.content || ''
                              )
                            }
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy
                          </Button>
                        </div>
                        <Input
                          readOnly
                          value={domain.verificationFile?.content}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          File URL: https://{domain.name}/
                          {domain.verificationFile?.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigator.clipboard.writeText(
                              `https://${domain.name}/${
                                domain.verificationFile?.name || ''
                              }`
                            )
                          }
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {domain.verificationMethod && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button
                      className="w-full"
                      onClick={handleVerify}
                      disabled={isVerifying}
                    >
                      {isVerifying && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Verify Domain
                    </Button>
                  </motion.div>
                )}
              </>
            ) : null}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
