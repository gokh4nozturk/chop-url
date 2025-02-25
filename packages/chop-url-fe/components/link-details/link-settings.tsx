'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CalendarDays, Globe, Lock } from 'lucide-react';

export const LinkSettings = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Link Settings</h3>
      <div className="grid gap-4 md:grid-cols-3">
        <PasswordProtectionDialog />
        <ExpiryDateDialog />
        <CustomDomainDialog />
      </div>
    </div>
  );
};

const PasswordProtectionDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Lock className="mr-2 h-4 w-4" />
          Password Protection
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Password Protection</DialogTitle>
          <DialogDescription>
            Add a password to protect your link from unauthorized access
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Label>Enable Password</Label>
            <Switch />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" placeholder="Enter password" />
          </div>
        </div>
        <Button className="w-full">Save Password</Button>
      </DialogContent>
    </Dialog>
  );
};

const ExpiryDateDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <CalendarDays className="mr-2 h-4 w-4" />
          Set Expiry Date
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Expiry Date</DialogTitle>
          <DialogDescription>
            Choose when this link should expire
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Label>Enable Expiry</Label>
            <Switch />
          </div>
          <div className="space-y-2">
            <Label>Expiry Date</Label>
            <Input type="datetime-local" />
          </div>
        </div>
        <Button className="w-full">Save Expiry Date</Button>
      </DialogContent>
    </Dialog>
  );
};

const CustomDomainDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Globe className="mr-2 h-4 w-4" />
          Custom Domain
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Custom Domain</DialogTitle>
          <DialogDescription>
            Use your own domain for this link
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select Domain</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select a domain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">chop-url.com</SelectItem>
                <SelectItem value="custom">Add New Domain</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Custom Path</Label>
            <Input placeholder="Enter custom path" />
          </div>
        </div>
        <Button className="w-full">Save Domain Settings</Button>
      </DialogContent>
    </Dialog>
  );
};
