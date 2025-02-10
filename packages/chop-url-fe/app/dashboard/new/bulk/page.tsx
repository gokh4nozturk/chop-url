'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import useUrlStore from '@/lib/store/url';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function BulkCreatePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [urls, setUrls] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const { createShortUrl } = useUrlStore();

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const urlList = urls
        .split('\n')
        .map((url) => url.trim())
        .filter((url) => url.length > 0);

      if (urlList.length === 0) {
        toast.error('Please enter at least one URL');
        return;
      }

      for (const url of urlList) {
        await createShortUrl(url);
      }

      router.push('/dashboard/links');
      toast.success('Links created successfully');
    } catch (error) {
      console.error('Failed to create links:', error);
      toast.error('Failed to create links');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setIsLoading(true);

    try {
      const text = await file.text();
      const urlList = text
        .split('\n')
        .map((url) => url.trim())
        .filter((url) => url.length > 0);

      if (urlList.length === 0) {
        toast.error('No URLs found in the file');
        return;
      }

      for (const url of urlList) {
        await createShortUrl(url);
      }

      router.push('/dashboard/links');
      toast.success('Links created successfully');
    } catch (error) {
      console.error('Failed to create links:', error);
      toast.error('Failed to create links');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-3xl">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Bulk Create Links
          </h2>
          <p className="text-muted-foreground">
            Create multiple shortened URLs at once.
          </p>
        </div>
      </div>

      <Tabs defaultValue="text" className="mt-8">
        <TabsList>
          <TabsTrigger value="text">Text Input</TabsTrigger>
          <TabsTrigger value="file">File Upload</TabsTrigger>
        </TabsList>
        <TabsContent value="text">
          <Card>
            <CardHeader>
              <CardTitle>Create Multiple URLs</CardTitle>
              <CardDescription>
                Enter one URL per line to create multiple shortened URLs at
                once.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTextSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="urls">URLs (one per line)</Label>
                  <Textarea
                    id="urls"
                    placeholder="https://example.com/very-long-url-1&#10;https://example.com/very-long-url-2&#10;https://example.com/very-long-url-3"
                    value={urls}
                    onChange={(e) => setUrls(e.target.value)}
                    required
                    rows={10}
                  />
                </div>

                <Button disabled={isLoading} className="w-full">
                  {isLoading && (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Links
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="file">
          <Card>
            <CardHeader>
              <CardTitle>Upload URL List</CardTitle>
              <CardDescription>
                Upload a text file containing one URL per line.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFileSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="file">URL List File</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".txt,.csv"
                    onChange={(e) =>
                      setFile(e.target.files ? e.target.files[0] : null)
                    }
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Accepted formats: .txt, .csv
                  </p>
                </div>

                <Button disabled={isLoading} className="w-full">
                  {isLoading && (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Upload and Create Links
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
