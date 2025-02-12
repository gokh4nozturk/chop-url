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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
import { TagInput } from '@/components/ui/tag-input';
import useUrlStore from '@/lib/store/url';
import { IUrlGroup } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { addDays, addHours, addMonths, addWeeks } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

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

const formSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid URL' }),
  customSlug: z
    .string()
    .regex(/^[a-zA-Z0-9-_]*$/, {
      message:
        'Custom URL can only contain letters, numbers, hyphens, and underscores',
    })
    .optional(),
  tags: z.array(z.string()).optional(),
  groupId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

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
  const { createShortUrl, urlGroups, getUserUrlGroups } = useUrlStore();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: '',
      customSlug: '',
      tags: [],
      groupId: undefined,
    },
  });

  useEffect(() => {
    getUserUrlGroups();
  }, [getUserUrlGroups]);

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

  const handleSubmit = async (values: FormValues) => {
    setIsLoading(true);

    try {
      let finalUrl = values.url;

      // Add UTM parameters if any are set
      if (isUtmOpen) {
        const urlObj = new URL(values.url);
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
        customSlug: values.customSlug || undefined,
        tags: values.tags,
        groupId: values.groupId ? parseInt(values.groupId) : undefined,
        expiresAt: expirationDate?.toISOString(),
      };

      await createShortUrl(finalUrl, options);
      router.push('/dashboard/links');
      toast.success('Link created successfully');
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container max-w-3xl"
    >
      <div className="flex items-center justify-between space-y-2">
        <div>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-2xl font-bold tracking-tight"
          >
            Create New Link
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground"
          >
            Create a new shortened URL for your long link.
          </motion.p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Tabs defaultValue="single" className="mt-8">
          <TabsList className="transition-all duration-300 hover:shadow-md">
            <TabsTrigger
              value="single"
              className="transition-all duration-300 data-[state=active]:shadow-sm"
            >
              Single URL
            </TabsTrigger>
            <TabsTrigger value="bulk" asChild>
              <Button
                variant="ghost"
                className="transition-all duration-300 data-[state=active]:bg-accent data-[state=active]:shadow-sm"
                asChild
              >
                <a href="/dashboard/new/bulk">Bulk Creation</a>
              </Button>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="single">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="transition-all duration-300 hover:shadow-md">
                <CardHeader>
                  <CardTitle>Create Single URL</CardTitle>
                  <CardDescription>
                    Create a single shortened URL with optional custom alias.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(handleSubmit)}
                      className="space-y-6"
                    >
                      <FormField
                        control={form.control}
                        name="url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Destination URL</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://example.com"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Enter the URL you want to shorten.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customSlug"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Custom Alias (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="my-custom-url" {...field} />
                            </FormControl>
                            <FormDescription>
                              Create your own custom URL.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tags (Optional)</FormLabel>
                            <FormControl>
                              <TagInput
                                placeholder="Press Enter to add tags"
                                tags={field.value || []}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormDescription>
                              Add tags to categorize your URL.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="groupId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Group (Optional)</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a group" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {urlGroups.map((group: IUrlGroup) => (
                                  <SelectItem
                                    key={group.id}
                                    value={group.id.toString()}
                                  >
                                    {group.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Add URL to a group.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <Label htmlFor="expiration">Link Expiration</Label>
                          <Switch
                            id="expiration"
                            checked={expiration.enabled}
                            onCheckedChange={(checked) =>
                              setExpiration({ ...expiration, enabled: checked })
                            }
                            className="transition-all duration-300"
                          />
                        </div>
                        <AnimatePresence>
                          {expiration.enabled && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="flex items-center gap-2"
                            >
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
                                className="w-24 transition-all duration-300 focus:shadow-md"
                              />
                              <Select
                                value={expiration.unit}
                                onValueChange={(
                                  value: ExpirationConfig['unit']
                                ) =>
                                  setExpiration({ ...expiration, unit: value })
                                }
                              >
                                <SelectTrigger className="transition-all duration-300 hover:shadow-md">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="hours">Hours</SelectItem>
                                  <SelectItem value="days">Days</SelectItem>
                                  <SelectItem value="weeks">Weeks</SelectItem>
                                  <SelectItem value="months">Months</SelectItem>
                                </SelectContent>
                              </Select>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                      >
                        <Collapsible
                          open={isUtmOpen}
                          onOpenChange={setIsUtmOpen}
                          className="space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <Label>Campaign Parameters (UTM)</Label>
                            <CollapsibleTrigger asChild>
                              <motion.div whileHover={{ scale: 1.1 }}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-9 p-0 transition-all duration-300"
                                >
                                  <motion.div
                                    animate={{ rotate: isUtmOpen ? 180 : 0 }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    <Icons.chevronUpDown className="h-4 w-4" />
                                  </motion.div>
                                  <span className="sr-only">
                                    Toggle UTM parameters
                                  </span>
                                </Button>
                              </motion.div>
                            </CollapsibleTrigger>
                          </div>
                          <CollapsibleContent className="space-y-4">
                            <AnimatePresence>
                              {isUtmOpen && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="space-y-4"
                                >
                                  <div className="space-y-2">
                                    <Label htmlFor="utm_source">
                                      Campaign Source
                                    </Label>
                                    <Input
                                      id="utm_source"
                                      placeholder="google"
                                      value={utmParams.source}
                                      onChange={(e) =>
                                        setUtmParams({
                                          ...utmParams,
                                          source: e.target.value,
                                        })
                                      }
                                      className="transition-all duration-300 focus:shadow-md"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="utm_medium">
                                      Campaign Medium
                                    </Label>
                                    <Input
                                      id="utm_medium"
                                      placeholder="cpc"
                                      value={utmParams.medium}
                                      onChange={(e) =>
                                        setUtmParams({
                                          ...utmParams,
                                          medium: e.target.value,
                                        })
                                      }
                                      className="transition-all duration-300 focus:shadow-md"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="utm_campaign">
                                      Campaign Name
                                    </Label>
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
                                      className="transition-all duration-300 focus:shadow-md"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="utm_term">
                                      Campaign Term
                                    </Label>
                                    <Input
                                      id="utm_term"
                                      placeholder="running+shoes"
                                      value={utmParams.term}
                                      onChange={(e) =>
                                        setUtmParams({
                                          ...utmParams,
                                          term: e.target.value,
                                        })
                                      }
                                      className="transition-all duration-300 focus:shadow-md"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="utm_content">
                                      Campaign Content
                                    </Label>
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
                                      className="transition-all duration-300 focus:shadow-md"
                                    />
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </CollapsibleContent>
                        </Collapsible>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="flex justify-end"
                      >
                        <motion.div whileHover={{ scale: 1.02 }}>
                          <Button
                            type="submit"
                            disabled={isLoading}
                            className="transition-all duration-300 hover:shadow-md"
                          >
                            {isLoading ? (
                              <>
                                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              <>
                                <Icons.plus className="mr-2 h-4 w-4" />
                                Create Link
                              </>
                            )}
                          </Button>
                        </motion.div>
                      </motion.div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
