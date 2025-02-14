'use client';

import { ProfileForm } from '@/components/dashboard/settings/profile-form';
import { SecurityForm } from '@/components/dashboard/settings/security-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/lib/store/auth';
import { motion } from 'framer-motion';
import { Shield, ShieldCheck, User2 } from 'lucide-react';
export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto space-y-6"
    >
      <div>
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-2xl font-bold tracking-tight"
        >
          Settings
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-muted-foreground"
        >
          Manage your account settings and preferences.
        </motion.p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="transition-all duration-300 hover:shadow-md">
          <TabsTrigger
            value="profile"
            className="transition-all duration-300 data-[state=active]:shadow-sm"
          >
            <User2 className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="transition-all duration-300 data-[state=active]:shadow-sm"
          >
            {user?.isTwoFactorEnabled ? (
              <ShieldCheck className="mr-2 h-4 w-4" />
            ) : (
              <Shield className="mr-2 h-4 w-4" />
            )}
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="transition-all duration-300 hover:shadow-md">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <motion.div
                    whileHover={{ rotate: 15 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <User2 className="h-5 w-5 text-primary" />
                  </motion.div>
                  <div>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>
                      Update your profile information.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ProfileForm />
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="transition-all duration-300 hover:shadow-md">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <motion.div
                    whileHover={{ rotate: 15 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    {user?.isTwoFactorEnabled ? (
                      <ShieldCheck className="h-5 w-5 text-primary" />
                    ) : (
                      <Shield className="h-5 w-5 text-primary" />
                    )}
                  </motion.div>
                  <div>
                    <CardTitle>Security</CardTitle>
                    <CardDescription>
                      Manage your security settings and preferences.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <SecurityForm />
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
