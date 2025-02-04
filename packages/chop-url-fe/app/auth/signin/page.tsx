'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Github } from "lucide-react";

export default function SignIn() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Chop URL</CardTitle>
          <CardDescription>Sign in to manage your shortened URLs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Button
              variant="outline"
              onClick={() => {
                console.log("sign in with github");
              }}
              className="flex items-center gap-2"
            >
              <Github className="h-5 w-5" />
              Sign in with GitHub
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 