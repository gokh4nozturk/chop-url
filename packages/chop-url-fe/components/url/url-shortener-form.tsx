'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { IUrlGroup } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const formSchema = z.object({
  url: z.string().url({ message: 'Geçerli bir URL giriniz' }),
  customSlug: z
    .string()
    .regex(/^[a-zA-Z0-9-_]*$/, {
      message: 'Özel URL sadece harf, rakam, tire ve alt çizgi içerebilir',
    })
    .optional(),
  tags: z.array(z.string()).optional(),
  groupId: z.string().optional(),
});

export function UrlShortenerForm() {
  const { createShortUrl, urlGroups, getUserUrlGroups } = useUrlStore();
  const form = useForm<z.infer<typeof formSchema>>({
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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await createShortUrl(values.url, {
        customSlug: values.customSlug || undefined,
        tags: values.tags,
        groupId: values.groupId ? parseInt(values.groupId) : undefined,
      });
      form.reset();
      toast.success('URL başarıyla kısaltıldı');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bir hata oluştu');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>URL Kısalt</CardTitle>
        <CardDescription>
          Uzun URL'lerinizi kısaltın ve yönetin.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Kısaltmak istediğiniz URL'yi girin.
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
                      {urlGroups.map((group: IUrlGroup) => (
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

            <Button type="submit">Kısalt</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
