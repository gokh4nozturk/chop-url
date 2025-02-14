'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UrlGroupForm } from '@/components/url/url-group-form';
import useUrlStore from '@/lib/store/url';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Loader2, Trash2, Folder } from 'lucide-react';

export default function GroupsPage() {
  const { urlGroups, getUserUrlGroups, isLoading } = useUrlStore();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    getUserUrlGroups();
  }, [getUserUrlGroups]);

  const filteredGroups = urlGroups.filter((group) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            URL Groups
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground"
          >
            Manage and organize your URLs with groups
          </motion.p>
        </div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <UrlGroupForm />
        </motion.div>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Search groups..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-[400px] items-center justify-center"
          >
            <Loader2 className="h-6 w-6 animate-spin" />
          </motion.div>
        ) : filteredGroups.length > 0 ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {filteredGroups.map((group) => (
              <Card key={group.id}>
                <CardHeader>
                  <CardTitle>{group.name}</CardTitle>
                  <CardDescription>
                    {group.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-end space-x-2">
                    <UrlGroupForm group={group} />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (
                          confirm('Are you sure you want to delete this group?')
                        ) {
                          useUrlStore.getState().deleteUrlGroup(group.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            className="flex h-[400px] flex-col items-center justify-center gap-2 rounded-lg border bg-background"
          >
            <motion.div
              whileHover={{ rotate: 15 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Folder className="h-8 w-8 text-muted-foreground" />
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-semibold"
            >
              No groups found
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-muted-foreground"
            >
              {searchTerm
                ? 'No groups match your search query'
                : "You haven't created any groups yet"}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
