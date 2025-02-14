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
import { TagInput } from '@/components/ui/tag-input';
import useUrlStore from '@/lib/store/url';
import { IUrl, IUrlGroup } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { addDays, addHours, addMonths, addWeeks } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronsUpDown, Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
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
  originalUrl: z.string().url({ message: 'Please enter a valid URL' }),
  customSlug: z
    .string()
    .regex(/^[a-zA-Z0-9-_]*$/, {
      message:
        'Custom URL can only contain letters, numbers, hyphens, and underscores',
    })
    .optional(),
  tags: z.array(z.string()).optional(),
  groupId: z.string().optional(),
  isActive: z.boolean(),
  // UTM Parameters
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmTerm: z.string().optional(),
  utmContent: z.string().optional(),
  // Expiration
  expirationEnabled: z.boolean(),
  expirationValue: z.number().min(1).optional(),
  expirationUnit: z.enum(['hours', 'days', 'weeks', 'months']).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditLinkPage() {
  const params = useParams();
  const shortId = params.shortId as string;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUtmOpen, setIsUtmOpen] = useState(false);
  const [expiration, setExpiration] = useState<ExpirationConfig>({
    enabled: false,
    value: 24,
    unit: 'hours',
  });
  const { updateUrl, urlGroups, getUserUrlGroups, getUrlDetails } =
    useUrlStore();
  const [url, setUrl] = useState<IUrl | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      originalUrl: '',
      customSlug: '',
      tags: [],
      groupId: undefined,
      isActive: true,
      utmSource: '',
      utmMedium: '',
      utmCampaign: '',
      utmTerm: '',
      utmContent: '',
      expirationEnabled: false,
      expirationValue: 24,
      expirationUnit: 'hours',
    },
  });

  useEffect(() => {
    getUserUrlGroups();
    const fetchUrl = async () => {
      try {
        const urlData = await getUrlDetails(shortId);
        if (urlData) {
          setUrl(urlData);

          // Parse UTM parameters from the original URL
          const urlObj = new URL(urlData.originalUrl);
          const utmSource =
            urlObj.searchParams.get('utm_source') || urlData.utmSource || '';
          const utmMedium =
            urlObj.searchParams.get('utm_medium') || urlData.utmMedium || '';
          const utmCampaign =
            urlObj.searchParams.get('utm_campaign') ||
            urlData.utmCampaign ||
            '';
          const utmTerm =
            urlObj.searchParams.get('utm_term') || urlData.utmTerm || '';
          const utmContent =
            urlObj.searchParams.get('utm_content') || urlData.utmContent || '';

          // Check if any UTM parameter exists
          const hasUtmParams = !!(
            utmSource ||
            utmMedium ||
            utmCampaign ||
            utmTerm ||
            utmContent
          );
          setIsUtmOpen(hasUtmParams);

          // Handle expiration settings
          const hasExpiration = !!urlData.expiresAt;
          let expirationValue = 24;
          let expirationUnit: ExpirationConfig['unit'] = 'hours';

          if (hasExpiration && urlData.expiresAt) {
            const now = new Date();
            const expiresAt = new Date(urlData.expiresAt);
            const diffHours = Math.ceil(
              (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)
            );

            if (diffHours > 0) {
              if (diffHours >= 720) {
                // 30 days
                expirationValue = Math.ceil(diffHours / 720);
                expirationUnit = 'months';
              } else if (diffHours >= 168) {
                // 7 days
                expirationValue = Math.ceil(diffHours / 168);
                expirationUnit = 'weeks';
              } else if (diffHours >= 24) {
                expirationValue = Math.ceil(diffHours / 24);
                expirationUnit = 'days';
              } else {
                expirationValue = diffHours;
                expirationUnit = 'hours';
              }
            }
          }

          setExpiration({
            enabled: hasExpiration,
            value: expirationValue,
            unit: expirationUnit,
          });

          form.reset({
            originalUrl: urlData.originalUrl,
            customSlug: urlData.customSlug || '',
            tags: urlData.tags || [],
            groupId: urlData.groupId?.toString(),
            isActive: urlData.isActive,
            // UTM Parameters
            utmSource,
            utmMedium,
            utmCampaign,
            utmTerm,
            utmContent,
            // Expiration settings
            expirationEnabled: hasExpiration,
            expirationValue,
            expirationUnit,
          });
        }
      } catch (error) {
        toast.error('Failed to fetch URL details');
        router.push('/dashboard/links');
      }
    };
    fetchUrl();
  }, [getUserUrlGroups, getUrlDetails, shortId, form, router]);

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      // Build the final URL with UTM parameters
      const finalUrl = values.originalUrl;
      const urlObj = new URL(finalUrl);

      // Clear existing UTM parameters
      urlObj.searchParams.delete('utm_source');
      urlObj.searchParams.delete('utm_medium');
      urlObj.searchParams.delete('utm_campaign');
      urlObj.searchParams.delete('utm_term');
      urlObj.searchParams.delete('utm_content');

      // Add new UTM parameters if they exist
      if (values.utmSource)
        urlObj.searchParams.set('utm_source', values.utmSource);
      if (values.utmMedium)
        urlObj.searchParams.set('utm_medium', values.utmMedium);
      if (values.utmCampaign)
        urlObj.searchParams.set('utm_campaign', values.utmCampaign);
      if (values.utmTerm) urlObj.searchParams.set('utm_term', values.utmTerm);
      if (values.utmContent)
        urlObj.searchParams.set('utm_content', values.utmContent);

      // Calculate expiration date
      let expiresAt: string | undefined;
      if (
        values.expirationEnabled &&
        values.expirationValue &&
        values.expirationUnit
      ) {
        const now = new Date();
        switch (values.expirationUnit) {
          case 'hours':
            expiresAt = addHours(now, values.expirationValue).toISOString();
            break;
          case 'days':
            expiresAt = addDays(now, values.expirationValue).toISOString();
            break;
          case 'weeks':
            expiresAt = addWeeks(now, values.expirationValue).toISOString();
            break;
          case 'months':
            expiresAt = addMonths(now, values.expirationValue).toISOString();
            break;
        }
      }

      await updateUrl(shortId, {
        originalUrl: urlObj.toString(),
        customSlug: values.customSlug || undefined,
        tags: values.tags,
        groupId: values.groupId ? parseInt(values.groupId) : undefined,
        isActive: values.isActive,
        expiresAt,
        // Store UTM parameters separately
        utmSource: values.utmSource || undefined,
        utmMedium: values.utmMedium || undefined,
        utmCampaign: values.utmCampaign || undefined,
        utmTerm: values.utmTerm || undefined,
        utmContent: values.utmContent || undefined,
        // Store expiration settings
        expirationEnabled: values.expirationEnabled,
        expirationValue: values.expirationValue,
        expirationUnit: values.expirationUnit,
      });

      toast.success('Link updated successfully');
      router.push('/dashboard/links');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update link'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!url) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

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
            Edit Link
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground"
          >
            Update your shortened URL properties.
          </motion.p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-8"
      >
        <Card className="transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle>Edit URL</CardTitle>
            <CardDescription>
              Modify the properties of your shortened URL.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="originalUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        The URL where users will be redirected to.
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
                      <FormDescription>Add URL to a group.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Enable or disable this shortened URL.
                        </FormDescription>
                      </div>
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
                          onValueChange={(value: ExpirationConfig['unit']) =>
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
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setIsUtmOpen(!isUtmOpen);
                            }}
                          >
                            <motion.div
                              animate={{ scale: isUtmOpen ? 1.1 : 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              <ChevronsUpDown className="h-4 w-4" />
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
                            <FormField
                              control={form.control}
                              name="utmSource"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Campaign Source</FormLabel>
                                  <FormControl>
                                    <Input placeholder="google" {...field} />
                                  </FormControl>
                                  <FormDescription>
                                    The referrer (e.g. google, newsletter)
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="utmMedium"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Campaign Medium</FormLabel>
                                  <FormControl>
                                    <Input placeholder="cpc" {...field} />
                                  </FormControl>
                                  <FormDescription>
                                    Marketing medium (e.g. cpc, banner, email)
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="utmCampaign"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Campaign Name</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="spring_sale"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    The individual campaign name, slogan, promo
                                    code, etc.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="utmTerm"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Campaign Term</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="running+shoes"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Identify the paid keywords
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="utmContent"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Campaign Content</FormLabel>
                                  <FormControl>
                                    <Input placeholder="logolink" {...field} />
                                  </FormControl>
                                  <FormDescription>
                                    Use to differentiate ads
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
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
                  className="flex justify-end space-x-4"
                >
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="transition-all duration-300 hover:shadow-md"
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="transition-all duration-300 hover:shadow-md"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Link'
                    )}
                  </Button>
                </motion.div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
