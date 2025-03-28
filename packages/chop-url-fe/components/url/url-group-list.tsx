'use client';

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
import useUrlStore from '@/lib/store/url';
import { IUrlGroup } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { MoreHorizontal, Trash } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { UrlGroupForm } from './url-group-form';

export function UrlGroupList() {
  const { urlGroups, getUserUrlGroups, deleteUrlGroup } = useUrlStore();

  useEffect(() => {
    getUserUrlGroups();
  }, [getUserUrlGroups]);

  const handleDelete = async (group: IUrlGroup) => {
    if (!confirm('Are you sure you want to delete this group?')) {
      return;
    }

    try {
      await deleteUrlGroup(group.id);
      toast.success('URL group successfully deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {urlGroups.map((group) => (
        <Card key={group.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{group.name}</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <UrlGroupForm group={group} />
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => handleDelete(group)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {group.description || 'No description'}
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(group.createdAt), {
              addSuffix: true,
              locale: enUS,
            })}
            {' created'}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
