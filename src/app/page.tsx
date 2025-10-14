'use client';

import { useState } from 'react';
import { useAuth } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Logo from '@/components/logo';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthAction = async (action: 'login' | 'signup') => {
    setIsLoading(true);
    try {
      if (action === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAnonymousLogin = async () => {
    setIsLoading(true);
    try {
      await signInAnonymously(auth);
      router.push('/sales');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Anonymous Login Failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo className="h-16 w-16" />
          </div>
          <CardTitle className="text-4xl font-headline font-bold">Welcome to ProfitPro</CardTitle>
          <CardDescription className="pt-2 text-lg">Your business sales and profit tracking solution.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="admin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="admin">Admin</TabsTrigger>
              <TabsTrigger value="agent">Sales Agent</TabsTrigger>
            </TabsList>
            <TabsContent value="admin">
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Button onClick={() => handleAuthAction('login')} disabled={isLoading || !email || !password}>
                    {isLoading ? 'Logging in...' : 'Log In'}
                  </Button>
                  <Button variant="outline" onClick={() => handleAuthAction('signup')} disabled={isLoading || !email || !password}>
                    {isLoading ? 'Signing up...' : 'Sign Up'}
                  </Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="agent">
              <div className="space-y-4 py-4">
                 <p className="text-sm text-center text-muted-foreground">Sales agents can log in anonymously to record sales.</p>
                 <Button onClick={handleAnonymousLogin} className="w-full" disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Anonymous Login'}
                 </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
