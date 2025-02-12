'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TagInput } from '@/components/ui/tag-input';
import useUrlStore from '@/lib/store/url';
import { IUrl } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useMediaQuery } from 'usehooks-ts';
import * as z from 'zod';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '../ui/drawer';
const formSchema = z.object({
  originalUrl: z.string().url({ message: 'Type a valid URL' }),
  customSlug: z
    .string()
    .regex(/^[a-zA-Z0-9-_]*$/, {
      message:
        'Custom URL can only contain letters, numbers, dashes and underscores',
    })
    .optional(),
  tags: z.array(z.string()).optional(),
  groupId: z.string().optional(),
  isActive: z.boolean(),
});

interface UrlFormProps {
  url: IUrl;
  onSuccess?: () => void;
}

export function UrlForm({ url, onSuccess }: UrlFormProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleSuccess = () => {
    setOpen(false);
    onSuccess?.();
  };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setOpen(true);
            }}
          >
            Edit
          </DropdownMenuItem>
        </DrawerTrigger>
        <DrawerContent className="px-4 max-h-[95vh] pb-40">
          <DrawerHeader>
            <DrawerTitle>Edit URL</DrawerTitle>
            <DrawerDescription>Update the URL's properties.</DrawerDescription>
          </DrawerHeader>
          <EditForm url={url} onSuccess={handleSuccess} />
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            setOpen(true);
          }}
        >
          Edit
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit URL</DialogTitle>
          <DialogDescription>Update the URL's properties.</DialogDescription>
        </DialogHeader>
        <EditForm url={url} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}

function EditForm({ url, onSuccess }: UrlFormProps) {
  const { updateUrl, urlGroups } = useUrlStore();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      originalUrl: url.originalUrl,
      customSlug: url.customSlug || '',
      tags: url.tags || [],
      groupId: url.groupId?.toString(),
      isActive: url.isActive,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await updateUrl(url.shortId, {
        originalUrl: values.originalUrl,
        customSlug: values.customSlug || undefined,
        tags: values.tags,
        groupId: values.groupId ? parseInt(values.groupId) : undefined,
        isActive: values.isActive,
      });
      onSuccess?.();
      toast.success('URL updated successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    }
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="originalUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" {...field} />
              </FormControl>
              <FormDescription>Enter the URL to be redirected.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customSlug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custom URL (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="my-custom-url" {...field} />
              </FormControl>
              <FormDescription>Create your own custom URL.</FormDescription>
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
                  placeholder="Press Enter to add a tag"
                  tags={field.value || []}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>Add tags to categorize the URL.</FormDescription>
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {urlGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Add the URL to a group.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Active</FormLabel>
                <FormDescription>
                  Determine if the URL is active.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="submit">Update</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
