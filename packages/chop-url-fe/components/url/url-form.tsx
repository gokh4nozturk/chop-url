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
import { Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const formSchema = z.object({
  originalUrl: z.string().url({ message: 'Geçerli bir URL giriniz' }),
  customSlug: z
    .string()
    .regex(/^[a-zA-Z0-9-_]*$/, {
      message: 'Özel URL sadece harf, rakam, tire ve alt çizgi içerebilir',
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
  const { updateUrl, urlGroups, getUserUrlGroups } = useUrlStore();
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

  useEffect(() => {
    getUserUrlGroups();
  }, [getUserUrlGroups]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await updateUrl(url.shortId, {
        originalUrl: values.originalUrl,
        customSlug: values.customSlug || undefined,
        tags: values.tags,
        groupId: values.groupId ? parseInt(values.groupId) : undefined,
        isActive: values.isActive,
      });
      setOpen(false);
      onSuccess?.();
      toast.success('URL başarıyla güncellendi');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bir hata oluştu');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start">
          <Pencil className="mr-2 h-4 w-4" />
          Düzenle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>URL'yi Düzenle</DialogTitle>
          <DialogDescription>
            URL'nin özelliklerini güncelleyin.
          </DialogDescription>
        </DialogHeader>
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
                  <FormDescription>
                    Yönlendirilecek URL'yi girin.
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
                  <FormLabel>Özel URL (İsteğe bağlı)</FormLabel>
                  <FormControl>
                    <Input placeholder="my-custom-url" {...field} />
                  </FormControl>
                  <FormDescription>
                    Kendi özel URL'nizi oluşturun.
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
                  <FormLabel>Etiketler (İsteğe bağlı)</FormLabel>
                  <FormControl>
                    <TagInput
                      placeholder="Etiket eklemek için Enter'a basın"
                      tags={field.value || []}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    URL'yi kategorize etmek için etiketler ekleyin.
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
                  <FormLabel>Grup (İsteğe bağlı)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Bir grup seçin" />
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
                  <FormDescription>URL'yi bir gruba ekleyin.</FormDescription>
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
                    <FormLabel>Aktif</FormLabel>
                    <FormDescription>
                      URL'nin aktif olup olmadığını belirleyin.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit">Güncelle</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
