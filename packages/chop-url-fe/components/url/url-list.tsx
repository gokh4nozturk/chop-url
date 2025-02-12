'use client';

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { QRCode } from '@/components/url/qr-code';
import { UrlForm } from '@/components/url/url-form';
import useUrlStore from '@/lib/store/url';
import { IUrl } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Copy,
  Link2,
  MoreHorizontal,
  Pencil,
  QrCode,
  Trash,
} from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

export function UrlList() {
  const { urls, getUserUrls, deleteUrl, urlGroups, getUserUrlGroups } =
    useUrlStore();

  useEffect(() => {
    getUserUrls();
    getUserUrlGroups();
  }, [getUserUrls, getUserUrlGroups]);

  const handleCopyUrl = async (url: IUrl) => {
    try {
      await navigator.clipboard.writeText(url.shortUrl);
      toast.success('URL panoya kopyalandı');
    } catch (error) {
      toast.error('URL kopyalanırken bir hata oluştu');
    }
  };

  const handleDelete = async (url: IUrl) => {
    if (!confirm("Bu URL'yi silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      await deleteUrl(url.shortId);
      toast.success('URL başarıyla silindi');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bir hata oluştu');
    }
  };

  const getGroupName = (groupId: number) => {
    const group = urlGroups.find((g) => g.id === groupId);
    return group?.name || 'Bilinmeyen Grup';
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {urls.map((url) => (
        <Card key={url.shortId}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {url.originalUrl.length > 30
                ? `${url.originalUrl.substring(0, 30)}...`
                : url.originalUrl}
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Menüyü aç</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleCopyUrl(url)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Kopyala
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <QRCode value={url.shortUrl} />
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <UrlForm url={url} />
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => handleDelete(url)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Sil
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <Link2 className="mr-2 inline-block h-4 w-4" />
              <a
                href={url.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {url.shortUrl}
              </a>
            </div>
            {url.tags && url.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {url.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            {url.groupId && (
              <div className="mt-2">
                <Badge variant="outline">{getGroupName(url.groupId)}</Badge>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between text-xs text-muted-foreground">
            <div>
              {formatDistanceToNow(new Date(url.createdAt), {
                addSuffix: true,
                locale: tr,
              })}
              {' oluşturuldu'}
            </div>
            <div>{url.visitCount} ziyaret</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
