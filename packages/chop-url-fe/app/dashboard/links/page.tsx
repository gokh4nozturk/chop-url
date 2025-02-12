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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import useUrlStore from '@/lib/store/url';
import { IUrl } from '@/lib/types';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function LinksPage() {
  const {
    urls,
    urlGroups,
    filteredUrls,
    searchTerm,
    setSearchTerm,
    setSortOption,
    sortOption,
    getUserUrls,
    getUserUrlGroups,
    isLoading: isLoadingUrls,
    error,
    filterByGroup,
    deleteUrl,
  } = useUrlStore();

  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  useEffect(() => {
    getUserUrls();
    getUserUrlGroups();
  }, [getUserUrls, getUserUrlGroups]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('URL copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy URL');
    }
  };

  const handleGroupChange = (value: string) => {
    setSelectedGroup(value);
    filterByGroup(value);
  };

  const handleDeleteUrl = (shortId: string) => {
    deleteUrl(shortId)
      .then(() => {
        toast.success('URL deleted successfully');
      })
      .catch((err) => {
        toast.error(
          err instanceof Error ? err.message : 'Failed to delete URL'
        );
      });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-2xl font-bold tracking-tight"
          >
            Links
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground"
          >
            Manage all your shortened URLs in one place.
          </motion.p>
        </div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Button
            asChild
            className="hover:shadow-md transition-all duration-300"
          >
            <Link href="/dashboard/new">
              <Icons.plus className="mr-2 h-4 w-4" />
              New Link
            </Link>
          </Button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex items-center gap-2"
      >
        <div className="flex-1 flex items-center gap-2">
          <Input
            placeholder="Search URLs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-[300px]"
          />
          <Select value={selectedGroup} onValueChange={handleGroupChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {urlGroups.map((group) => (
                <SelectItem key={group.id} value={group.id.toString()}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Button
                variant="outline"
                size="icon"
                className="hover:shadow-md transition-all duration-300"
              >
                <Icons.moreVertical className="h-4 w-4" />
              </Button>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setSortOption('newest')}
              className={`transition-colors duration-200 ${
                sortOption === 'newest' ? 'bg-accent' : ''
              }`}
            >
              Most Recent
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSortOption('most-visited')}
              className={`transition-colors duration-200 ${
                sortOption === 'most-visited' ? 'bg-accent' : ''
              }`}
            >
              Most Clicked
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSortOption('least-visited')}
              className={`transition-colors duration-200 ${
                sortOption === 'least-visited' ? 'bg-accent' : ''
              }`}
            >
              Least Clicked
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSortOption('oldest')}
              className={`transition-colors duration-200 ${
                sortOption === 'oldest' ? 'bg-accent' : ''
              }`}
            >
              Oldest
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      <AnimatePresence mode="wait">
        {isLoadingUrls ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-[400px] items-center justify-center"
          >
            <Icons.spinner className="h-6 w-6 animate-spin" />
          </motion.div>
        ) : (searchTerm ? filteredUrls : urls).length > 0 ? (
          <motion.div
            key="table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-md border shadow-sm hover:shadow-md transition-all duration-300"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Short URL</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Long URL
                  </TableHead>
                  <TableHead>Visits</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Created
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Last Accessed
                  </TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {(searchTerm ? filteredUrls : urls).map(
                    (link: IUrl, index: number) => (
                      <motion.tr
                        key={link.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.05,
                        }}
                        className="group"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {link.shortUrl}
                            <motion.div whileHover={{ scale: 1.1 }}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-300"
                                onClick={() => copyToClipboard(link.shortUrl)}
                              >
                                <Icons.copy className="h-4 w-4" />
                              </Button>
                            </motion.div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden max-w-[200px] truncate md:table-cell">
                          {link.originalUrl}
                        </TableCell>
                        <TableCell>{link.visitCount}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {new Date(link.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {link.lastAccessedAt
                            ? new Date(link.lastAccessedAt).toLocaleDateString()
                            : 'Never'}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <motion.div whileHover={{ scale: 1.1 }}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 transition-all duration-300"
                                >
                                  <Icons.moreVertical className="h-4 w-4" />
                                </Button>
                              </motion.div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/links/${link.shortId}`}>
                                  Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/dashboard/analytics/${link.shortId}`}
                                >
                                  Analytics
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/dashboard/links/${link.shortId}/edit`}
                                >
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteUrl(link.shortId)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    )
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            className="flex h-[400px] flex-col items-center justify-center gap-2 rounded-lg border bg-background hover:shadow-md transition-all duration-300"
          >
            <motion.div
              whileHover={{ rotate: 15 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Icons.link className="h-8 w-8 text-muted-foreground" />
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-semibold"
            >
              No links found
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-muted-foreground"
            >
              {searchTerm
                ? 'No links match your search query'
                : "You haven't created any links yet"}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
