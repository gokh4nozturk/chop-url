'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useUrlStore from '@/lib/store/url';
import { addDays, addHours, addMonths, addWeeks } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface UTMParams {
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
}

interface ExpirationConfig {
  enabled: boolean;
  value: number;
  unit: 'hours' | 'days' | 'weeks' | 'months';
}

export default function NewLinkPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [url, setUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [isUtmOpen, setIsUtmOpen] = useState(false);
  const [utmParams, setUtmParams] = useState<UTMParams>({
    source: '',
    medium: '',
    campaign: '',
    term: '',
    content: '',
  });
  const [expiration, setExpiration] = useState<ExpirationConfig>({
    enabled: false,
    value: 24,
    unit: 'hours',
  });
  const { createShortUrl, error: urlError } = useUrlStore();

  const calculateExpirationDate = () => {
    if (!expiration.enabled) return null;

    const now = new Date();
    switch (expiration.unit) {
      case 'hours':
        return addHours(now, expiration.value);
      case 'days':
        return addDays(now, expiration.value);
      case 'weeks':
        return addWeeks(now, expiration.value);
      case 'months':
        return addMonths(now, expiration.value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let finalUrl = url;

      // Add UTM parameters if any are set
      if (isUtmOpen) {
        const urlObj = new URL(url);
        if (utmParams.source)
          urlObj.searchParams.set('utm_source', utmParams.source);
        if (utmParams.medium)
          urlObj.searchParams.set('utm_medium', utmParams.medium);
        if (utmParams.campaign)
          urlObj.searchParams.set('utm_campaign', utmParams.campaign);
        if (utmParams.term) urlObj.searchParams.set('utm_term', utmParams.term);
        if (utmParams.content)
          urlObj.searchParams.set('utm_content', utmParams.content);
        finalUrl = urlObj.toString();
      }

      const expirationDate = calculateExpirationDate();
      const options = {
        customSlug: customAlias,
        expiresAt: expirationDate?.toISOString(),
      };

      await createShortUrl(finalUrl, options);
      router.push('/dashboard/links');
      toast.success('Link created successfully');
    } catch (error) {
      console.error('Failed to create link:', error);
      toast.error(urlError?.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-3xl">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Create New Link</h2>
          <p className="text-muted-foreground">
            Create a new shortened URL for your long link.
          </p>
        </div>
      </div>

      <Tabs defaultValue="single" className="mt-8">
        <TabsList>
          <TabsTrigger value="single">Single URL</TabsTrigger>
          <TabsTrigger value="bulk" asChild>
            <Button
              variant="ghost"
              className="data-[state=active]:bg-accent"
              asChild
            >
              <a href="/dashboard/new/bulk">Bulk Creation</a>
            </Button>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="single">
          <Card>
            <CardHeader>
              <CardTitle>Create Single URL</CardTitle>
              <CardDescription>
                Create a single shortened URL with optional custom alias.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="url">Destination URL</Label>
                  <Input
                    id="url"
                    placeholder="https://example.com/very-long-url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alias">Custom Alias (Optional)</Label>
                  <Input
                    id="alias"
                    placeholder="my-custom-url"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Leave empty for an automatically generated short URL.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="expiration">Link Expiration</Label>
                    <Switch
                      id="expiration"
                      checked={expiration.enabled}
                      onCheckedChange={(checked) =>
                        setExpiration({ ...expiration, enabled: checked })
                      }
                    />
                  </div>
                  {expiration.enabled && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={expiration.value}
                        onChange={(e) =>
                          setExpiration({
                            ...expiration,
                            value: parseInt(e.target.value) || 1,
                          })
                        }
                        className="w-24"
                      />
                      <Select
                        value={expiration.unit}
                        onValueChange={(value: ExpirationConfig['unit']) =>
                          setExpiration({ ...expiration, unit: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hours">Hours</SelectItem>
                          <SelectItem value="days">Days</SelectItem>
                          <SelectItem value="weeks">Weeks</SelectItem>
                          <SelectItem value="months">Months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <Collapsible
                  open={isUtmOpen}
                  onOpenChange={setIsUtmOpen}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Label>Campaign Parameters (UTM)</Label>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-9 p-0">
                        <Icons.chevronUpDown className="h-4 w-4" />
                        <span className="sr-only">Toggle UTM parameters</span>
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="utm_source">Campaign Source</Label>
                      <Input
                        id="utm_source"
                        placeholder="google"
                        value={utmParams.source}
                        onChange={(e) =>
                          setUtmParams({ ...utmParams, source: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="utm_medium">Campaign Medium</Label>
                      <Input
                        id="utm_medium"
                        placeholder="cpc"
                        value={utmParams.medium}
                        onChange={(e) =>
                          setUtmParams({ ...utmParams, medium: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="utm_campaign">Campaign Name</Label>
                      <Input
                        id="utm_campaign"
                        placeholder="spring_sale"
                        value={utmParams.campaign}
                        onChange={(e) =>
                          setUtmParams({
                            ...utmParams,
                            campaign: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="utm_term">Campaign Term</Label>
                      <Input
                        id="utm_term"
                        placeholder="running+shoes"
                        value={utmParams.term}
                        onChange={(e) =>
                          setUtmParams({ ...utmParams, term: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="utm_content">Campaign Content</Label>
                      <Input
                        id="utm_content"
                        placeholder="logolink"
                        value={utmParams.content}
                        onChange={(e) =>
                          setUtmParams({
                            ...utmParams,
                            content: e.target.value,
                          })
                        }
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Button disabled={isLoading} className="w-full">
                  {isLoading && (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Link
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
