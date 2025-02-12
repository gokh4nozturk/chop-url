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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import useUrlStore from '@/lib/store/url';
import { IUrlGroup } from '@/lib/types';
import { useState } from 'react';
import { toast } from 'sonner';

interface UrlGroupFormProps {
  group?: IUrlGroup;
  onSuccess?: () => void;
}

export function UrlGroupForm({ group, onSuccess }: UrlGroupFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(group?.name || '');
  const [description, setDescription] = useState(group?.description || '');
  const { createUrlGroup, updateUrlGroup } = useUrlStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (group) {
        await updateUrlGroup(group.id, { name, description });
        toast.success('URL grubu başarıyla güncellendi');
      } else {
        await createUrlGroup(name, description);
        toast.success('URL grubu başarıyla oluşturuldu');
      }
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bir hata oluştu');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={group ? 'outline' : 'default'}>
          {group ? 'Düzenle' : 'Yeni Grup Oluştur'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {group ? 'URL Grubunu Düzenle' : 'Yeni URL Grubu'}
          </DialogTitle>
          <DialogDescription>
            URL'lerinizi organize etmek için gruplar oluşturun.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                İsim
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Açıklama
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">{group ? 'Güncelle' : 'Oluştur'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
