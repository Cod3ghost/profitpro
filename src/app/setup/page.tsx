'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Logo from '@/components/logo';
import Link from 'next/link';
export default function SetupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const { toast } = useToast();

  const handleCreateAdminUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !firstName || !lastName) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'All fields are required.',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Password must be at least 6 characters long.',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Call API route to create admin user
      const response = await fetch('/api/setup-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success!',
          description: 'Admin account created successfully! You can now login with your credentials.',
        });

        // Clear form
        setEmail('');
        setPassword('');
        setFirstName('');
        setLastName('');
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.message,
        });
      }
    } catch (error: any) {
      console.error('Error creating admin user:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo className="h-16 w-16" />
          </div>
          <CardTitle className="text-3xl font-headline font-bold">Admin Setup</CardTitle>
          <CardDescription className="pt-2">
            Create the first admin account for your ProfitPro application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleCreateAdminUser} className="space-y-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Admin Account...' : 'Create Admin Account'}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              This will create a new admin user that can login and manage the application.
            </p>
          </form>

          <div className="border-t pt-6">
            <h3 className="font-semibold text-lg mb-3">Alternative: Use Supabase Dashboard</h3>
            <div className="text-sm space-y-4 text-muted-foreground">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-semibold mb-2">Manual setup via Supabase Dashboard:</p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Supabase Dashboard</a></li>
                  <li>Select your project and navigate to <strong>Authentication</strong></li>
                  <li>Click <strong>Add user</strong> and create a new user with email/password</li>
                  <li>Copy the user's UUID</li>
                  <li>Navigate to <strong>Table Editor</strong> → <code className="bg-background px-1 py-0.5 rounded text-xs">users</code> table</li>
                  <li>Insert a new row with the UUID and set <code className="bg-background px-1 py-0.5 rounded text-xs">role</code> to <code className="bg-background px-1 py-0.5 rounded text-xs">admin</code></li>
                  <li>Login with the email/password you created</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="text-center pt-4 border-t">
            <Link href="/" className="text-sm text-primary hover:underline">
              ← Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
