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
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import apiClient from '@/lib/api/client';
import { useDomainStore } from '@/lib/store/domain';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  ExternalLink,
  Globe,
  HelpCircle,
  Loader2,
  Lock,
  Network,
  RefreshCw,
  Shield,
  Trash,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface DomainHealth {
  status: 'healthy' | 'issues' | 'critical';
  dnsStatus: 'ok' | 'issues' | 'unreachable';
  sslStatus: string;
  lastChecked: string;
  metrics: {
    sslDetails: {
      validFrom?: string;
      validTo?: string;
      issuer?: string;
      autoRenewal: boolean;
      daysUntilExpiry?: number;
    };
    performance: {
      responseTime: number;
      uptime: number;
      lastDowntime?: string;
    };
    security: {
      sslGrade?: string;
      hsts: boolean;
      securityHeaders: boolean;
    };
  };
  issues: Array<{
    type: 'dns' | 'ssl' | 'response' | 'security';
    severity: 'warning' | 'error';
    message: string;
    recommendation?: string;
  }>;
}

interface ExtendedDomain {
  id: number;
  domain: string;
  isVerified: boolean;
  verificationToken: string;
  verificationMethod: 'DNS_TXT' | 'DNS_CNAME' | 'FILE';
  sslStatus: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  lastHealthCheck?: string;
  settings: {
    redirectMode: 'PROXY' | 'REDIRECT';
    customNameservers: string | null;
    forceSSL: boolean;
  };
}

export default function DomainDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const domainId = Number(params.id);
  const { domains, fetchDomains, requestSsl, checkSslStatus, verifyDomain } =
    useDomainStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [healthData, setHealthData] = useState<DomainHealth | null>(null);
  const [lastHealthCheck, setLastHealthCheck] = useState<string | null>(null);

  const domain = domains.find((d) => d.id === domainId);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      await fetchDomains();
    } finally {
      setIsLoading(false);
    }
  }, [fetchDomains]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCheckHealth = async () => {
    try {
      setIsChecking(true);

      // Gerçek API çağrısı
      const response = await apiClient.get(`/domains/${domainId}/health`);
      setHealthData(response.data);
      setLastHealthCheck(new Date().toISOString());

      // SSL durumunu da kontrol et
      if (domain?.sslStatus === 'PENDING') {
        await checkSslStatus(domainId);
      }
    } catch (error) {
      console.error('Failed to check domain health:', error);
      // Hata durumunda varsayılan sağlık verisi oluştur
      setHealthData({
        status: 'issues',
        dnsStatus: 'issues',
        sslStatus: domain?.sslStatus || 'FAILED',
        lastChecked: new Date().toISOString(),
        metrics: {
          sslDetails: {
            autoRenewal: false,
          },
          performance: {
            responseTime: 0,
            uptime: 0,
          },
          security: {
            hsts: false,
            securityHeaders: false,
          },
        },
        issues: [
          {
            type: 'response',
            severity: 'error',
            message: 'Health check failed',
          },
        ],
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Sağlık durumuna göre renk belirle
  const getStatusColor = (status: string) => {
    if (status === 'healthy' || status === 'ACTIVE' || status === 'ok') {
      return 'text-green-500';
    }
    if (
      status === 'issues' ||
      status === 'PENDING' ||
      status === 'INITIALIZING'
    ) {
      return 'text-yellow-500';
    }
    if (
      status === 'critical' ||
      status === 'FAILED' ||
      status === 'EXPIRED' ||
      status === 'unreachable' ||
      status === 'INACTIVE'
    ) {
      return 'text-red-500';
    }
    return 'text-muted-foreground';
  };

  // Sağlık durumuna göre ikon belirle
  const getStatusIcon = (status: string) => {
    if (status === 'healthy' || status === 'ACTIVE' || status === 'ok') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (
      status === 'issues' ||
      status === 'PENDING' ||
      status === 'INITIALIZING'
    ) {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
    if (
      status === 'critical' ||
      status === 'FAILED' ||
      status === 'EXPIRED' ||
      status === 'unreachable' ||
      status === 'INACTIVE'
    ) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    return <HelpCircle className="h-5 w-5 text-muted-foreground" />;
  };

  if (isLoading) {
    return (
      <div className="flex h-24 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!domain) {
    return (
      <Alert>
        <AlertDescription>Domain not found.</AlertDescription>
      </Alert>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-2xl font-bold tracking-tight"
          >
            {domain.domain}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground"
          >
            Added: {new Date(domain.createdAt).toLocaleDateString()}
          </motion.p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCheckHealth}
            className="w-full sm:w-auto"
            disabled={isChecking}
          >
            {isChecking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Health Check
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="w-full sm:w-auto"
          >
            <Link href={`https://${domain.domain}`} target="_blank">
              <Globe className="mr-2 h-4 w-4" />
              Visit
              <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Durum Özeti Kartları */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Domain Durum Kartı */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Domain Status</CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Shield className="mr-2 h-5 w-5 text-muted-foreground" />
                <span>Verification</span>
              </div>
              <div className="flex items-center">
                {domain.isVerified ? (
                  <Badge
                    variant="outline"
                    className="bg-green-500/10 text-green-500"
                  >
                    Verified
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-yellow-500/10 text-yellow-500"
                  >
                    Pending
                  </Badge>
                )}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center">
                <Lock className="mr-2 h-5 w-5 text-muted-foreground" />
                <span>SSL</span>
              </div>
              <div className="flex items-center">
                {domain.sslStatus === 'ACTIVE' ? (
                  <Badge
                    variant="outline"
                    className="bg-green-500/10 text-green-500"
                  >
                    Active
                  </Badge>
                ) : domain.sslStatus === 'PENDING' ||
                  domain.sslStatus === 'INITIALIZING' ? (
                  <Badge
                    variant="outline"
                    className="bg-yellow-500/10 text-yellow-500"
                  >
                    Pending
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-red-500/10 text-red-500"
                  >
                    Failed
                  </Badge>
                )}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center">
                <Network className="mr-2 h-5 w-5 text-muted-foreground" />
                <span>Active</span>
              </div>
              <div className="flex items-center">
                {domain.isActive ? (
                  <Badge
                    variant="outline"
                    className="bg-green-500/10 text-green-500"
                  >
                    Active
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-red-500/10 text-red-500"
                  >
                    Inactive
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            {!domain.isVerified ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() =>
                  router.push(`/dashboard/domains/${domainId}/verify`)
                }
              >
                <Shield className="mr-2 h-4 w-4" />
                Verify
              </Button>
            ) : domain.sslStatus !== 'ACTIVE' ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() =>
                  router.push(`/dashboard/domains/${domainId}/ssl`)
                }
              >
                <Lock className="mr-2 h-4 w-4" />
                SSL Manage
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() =>
                  router.push(`/dashboard/domains/${domainId}/dns`)
                }
              >
                <Network className="mr-2 h-4 w-4" />
                DNS Manage
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Sağlık Durumu Kartı */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Health Status</CardTitle>
            <CardDescription>
              {lastHealthCheck
                ? `Last check: ${new Date(lastHealthCheck).toLocaleString()}`
                : 'Not checked yet'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            {healthData ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Activity className="mr-2 h-5 w-5 text-muted-foreground" />
                    <span>General Status</span>
                  </div>
                  <div className="flex items-center">
                    {getStatusIcon(healthData.status)}
                    <span
                      className={`ml-1 ${getStatusColor(healthData.status)}`}
                    >
                      {healthData.status === 'healthy'
                        ? 'Healthy'
                        : healthData.status === 'issues'
                          ? 'Has Issues'
                          : 'Critical'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Network className="mr-2 h-5 w-5 text-muted-foreground" />
                    <span>DNS</span>
                  </div>
                  <div className="flex items-center">
                    {getStatusIcon(healthData.dnsStatus)}
                    <span
                      className={`ml-1 ${getStatusColor(healthData.dnsStatus)}`}
                    >
                      {healthData.dnsStatus === 'ok'
                        ? 'Healthy'
                        : healthData.dnsStatus === 'issues'
                          ? 'Has Issues'
                          : 'Unreachable'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Lock className="mr-2 h-5 w-5 text-muted-foreground" />
                    <span>SSL</span>
                  </div>
                  <div className="flex items-center">
                    {getStatusIcon(healthData.sslStatus)}
                    <span
                      className={`ml-1 ${getStatusColor(healthData.sslStatus)}`}
                    >
                      {healthData.sslStatus === 'ACTIVE'
                        ? 'Active'
                        : healthData.sslStatus === 'PENDING' ||
                            healthData.sslStatus === 'INITIALIZING'
                          ? 'Pending'
                          : 'Failed'}
                    </span>
                  </div>
                </div>

                {healthData.issues.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium">Detected Issues</h4>
                    {healthData.issues.map((issue, index) => (
                      <div
                        key={`${issue.type}-${index}`}
                        className={`rounded-md px-3 py-2 text-sm ${
                          issue.severity === 'error'
                            ? 'bg-red-500/10 text-red-500'
                            : 'bg-yellow-500/10 text-yellow-500'
                        }`}
                      >
                        {issue.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <HelpCircle className="h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No health status information. Use the button above to perform
                  a health check.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleCheckHealth}
              disabled={isChecking}
            >
              {isChecking ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {isChecking ? 'Checking...' : 'Check Again'}
            </Button>
          </CardFooter>
        </Card>

        {/* Ayarlar Kartı */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Quick Access</CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() =>
                  router.push(`/dashboard/domains/${domainId}/dns`)
                }
              >
                <Network className="mr-2 h-4 w-4" />
                DNS Records
                <ArrowRight className="ml-auto h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() =>
                  router.push(`/dashboard/domains/${domainId}/ssl`)
                }
              >
                <Lock className="mr-2 h-4 w-4" />
                SSL Management
                <ArrowRight className="ml-auto h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() =>
                  router.push(`/dashboard/domains/${domainId}/verify`)
                }
              >
                <Shield className="mr-2 h-4 w-4" />
                Domain Verification
                <ArrowRight className="ml-auto h-4 w-4" />
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <div className="w-full">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="mb-2">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span>Domain Health</span>
                        <span
                          className={getStatusColor(
                            healthData?.status || 'issues'
                          )}
                        >
                          {healthData?.status === 'healthy'
                            ? '100%'
                            : healthData?.status === 'issues'
                              ? '70%'
                              : '30%'}
                        </span>
                      </div>
                      <Progress
                        value={
                          healthData?.status === 'healthy'
                            ? 100
                            : healthData?.status === 'issues'
                              ? 70
                              : 30
                        }
                        className={`h-2 ${
                          healthData?.status === 'healthy'
                            ? 'bg-green-500'
                            : healthData?.status === 'issues'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Domain health score is calculated based on DNS, SSL, and
                      accessibility status.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Detaylı Bilgiler */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Detailed Health Status</CardTitle>
          <CardDescription>
            Domain health status and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="health" className="space-y-4">
            <TabsList>
              <TabsTrigger value="health">
                <Activity className="mr-2 h-4 w-4" />
                Health
              </TabsTrigger>
              <TabsTrigger value="ssl">
                <Lock className="mr-2 h-4 w-4" />
                SSL
              </TabsTrigger>
              <TabsTrigger value="performance">
                <Network className="mr-2 h-4 w-4" />
                Performance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="health" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      General Health Status
                    </CardTitle>
                    {getStatusIcon(healthData?.status || 'issues')}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {healthData?.status === 'healthy'
                        ? '100%'
                        : healthData?.status === 'issues'
                          ? '70%'
                          : '30%'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Last check:{' '}
                      {new Date(healthData?.lastChecked || '').toLocaleString()}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Active Issues
                    </CardTitle>
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {healthData?.issues?.length || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {healthData?.issues?.filter((i) => i.severity === 'error')
                        .length || 0}{' '}
                      critical,
                      {healthData?.issues?.filter(
                        (i) => i.severity === 'warning'
                      ).length || 0}{' '}
                      warnings
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Uptime
                    </CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {healthData?.metrics?.performance?.uptime.toFixed(2)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Last downtime:{' '}
                      {healthData?.metrics?.performance?.lastDowntime
                        ? new Date(
                            healthData.metrics.performance.lastDowntime
                          ).toLocaleString()
                        : 'None'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {healthData?.issues && healthData.issues.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Active Issues</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {healthData.issues.map((issue) => (
                        <div
                          key={`${issue.type}-${issue.severity}-${issue.message}`}
                          className={`rounded-lg border p-4 ${
                            issue.severity === 'error'
                              ? 'border-red-200 bg-red-50'
                              : 'border-yellow-200 bg-yellow-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            {issue.severity === 'error' ? (
                              <XCircle className="h-5 w-5 text-red-500" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            )}
                            <span className="font-medium">{issue.message}</span>
                          </div>
                          {issue.recommendation && (
                            <p className="mt-2 text-sm text-muted-foreground">
                              Recommendation: {issue.recommendation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="ssl" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>SSL Certificate Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium">Status</p>
                        <div className="mt-1 flex items-center space-x-2">
                          {getStatusIcon(healthData?.sslStatus || 'FAILED')}
                          <span
                            className={getStatusColor(
                              healthData?.sslStatus || 'FAILED'
                            )}
                          >
                            {healthData?.sslStatus}
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium">Provider</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {healthData?.metrics?.sslDetails?.issuer ||
                            'Cloudflare'}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium">Valid From</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {healthData?.metrics?.sslDetails?.validFrom
                            ? new Date(
                                healthData.metrics.sslDetails.validFrom
                              ).toLocaleString()
                            : '-'}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium">Valid Until</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {healthData?.metrics?.sslDetails?.validTo
                            ? new Date(
                                healthData.metrics.sslDetails.validTo
                              ).toLocaleString()
                            : '-'}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium">Auto Renewal</p>
                        <div className="mt-1">
                          {healthData?.metrics?.sslDetails?.autoRenewal ? (
                            <Badge
                              variant="outline"
                              className="bg-green-500/10 text-green-500"
                            >
                              Active
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-yellow-500/10 text-yellow-500"
                            >
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium">Time Remaining</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {healthData?.metrics?.sslDetails?.daysUntilExpiry
                            ? `${healthData.metrics.sslDetails.daysUntilExpiry} days`
                            : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <p className="text-sm font-medium">SSL Grade</p>
                        <div className="mt-1">
                          <Badge
                            variant="outline"
                            className={`${
                              healthData?.metrics?.security?.sslGrade === 'A'
                                ? 'bg-green-500/10 text-green-500'
                                : 'bg-yellow-500/10 text-yellow-500'
                            }`}
                          >
                            {healthData?.metrics?.security?.sslGrade || '-'}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium">HSTS</p>
                        <div className="mt-1">
                          {healthData?.metrics?.security?.hsts ? (
                            <Badge
                              variant="outline"
                              className="bg-green-500/10 text-green-500"
                            >
                              Active
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-red-500/10 text-red-500"
                            >
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium">Security Headers</p>
                        <div className="mt-1">
                          {healthData?.metrics?.security?.securityHeaders ? (
                            <Badge
                              variant="outline"
                              className="bg-green-500/10 text-green-500"
                            >
                              Configured
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-yellow-500/10 text-yellow-500"
                            >
                              Missing
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium">Response Time</p>
                        <div className="mt-1">
                          <span className="text-2xl font-bold">
                            {healthData?.metrics?.performance?.responseTime}ms
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium">Uptime</p>
                        <div className="mt-1">
                          <span className="text-2xl font-bold">
                            {healthData?.metrics?.performance?.uptime.toFixed(
                              2
                            )}
                            %
                          </span>
                        </div>
                      </div>
                    </div>

                    {healthData?.metrics?.performance?.lastDowntime && (
                      <div>
                        <p className="text-sm font-medium">Last Downtime</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {new Date(
                            healthData.metrics.performance.lastDowntime
                          ).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}
