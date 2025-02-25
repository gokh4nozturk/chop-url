'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IUrl } from '@/lib/types';

interface ActivityHistoryProps {
  urlDetails: IUrl;
}

export const ActivityHistory = ({ urlDetails }: ActivityHistoryProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity History</CardTitle>
        <CardDescription>
          Recent visits and changes to your link
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="visits">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="visits">Recent Visits</TabsTrigger>
            <TabsTrigger value="changes">Changes</TabsTrigger>
          </TabsList>
          <TabsContent value="visits" className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Device</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {urlDetails.visitCount > 0 ? (
                  <TableRow>
                    <TableCell className="text-sm">
                      {new Date().toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="text-sm">Unknown</TableCell>
                    <TableCell className="text-sm">Desktop</TableCell>
                  </TableRow>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground"
                    >
                      No visits yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>
          <TabsContent value="changes" className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="text-sm">
                    {new Date(urlDetails.createdAt).toLocaleDateString(
                      'en-US',
                      {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      }
                    )}
                  </TableCell>
                  <TableCell className="text-sm">Link created</TableCell>
                  <TableCell className="text-sm">You</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
