'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import useUrlStore from '@/lib/store/url';
import Link from 'next/link';
import { useState } from 'react';

export default function LinksPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { urls, isLoading: isLoadingUrls, error } = useUrlStore();

  const filteredLinks = urls.filter(
    (link) =>
      link.shortUrl?.includes(searchQuery) ||
      link.originalUrl?.includes(searchQuery)
  );

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xs:flex-row xs:items-center xs:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Links</h2>
          <p className="text-muted-foreground">
            Manage all your shortened URLs in one place.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/new">
            <Icons.plus className="mr-2 h-4 w-4" />
            New Link
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            placeholder="Search links..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Icons.moreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Most Recent</DropdownMenuItem>
            <DropdownMenuItem>Most Clicked</DropdownMenuItem>
            <DropdownMenuItem>Alphabetical</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoadingUrls ? (
        <div className="flex h-[400px] items-center justify-center">
          <Icons.spinner className="h-6 w-6 animate-spin" />
        </div>
      ) : filteredLinks.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Short URL</TableHead>
                <TableHead className="hidden md:table-cell">Long URL</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead className="hidden sm:table-cell">Created</TableHead>
                <TableHead className="hidden lg:table-cell">
                  Last Click
                </TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLinks.map((link) => (
                <TableRow key={link.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {link.shortUrl}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyToClipboard(link.shortUrl)}
                      >
                        <Icons.copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="hidden max-w-[200px] truncate md:table-cell">
                    {link.originalUrl}
                  </TableCell>
                  <TableCell>{link.clicks}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {new Date(link.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {/* {link.lastClickedAt
                      ? new Date(link.lastClickedAt).toLocaleDateString()
                      : 'Never'} */}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Icons.moreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Analytics</DropdownMenuItem>
                        <DropdownMenuItem>QR Code</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex h-[400px] flex-col items-center justify-center gap-2 rounded-lg border bg-background">
          <Icons.link className="h-8 w-8 text-muted-foreground" />
          <h3 className="font-semibold">No links found</h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? 'No links match your search query'
              : "You haven't created any links yet"}
          </p>
        </div>
      )}
    </div>
  );
}
