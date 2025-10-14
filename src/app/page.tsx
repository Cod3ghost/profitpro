import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, UserCog, User } from 'lucide-react';
import Logo from '@/components/logo';

export default function Home() {
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
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">Choose your role to get started:</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link href="/dashboard" passHref>
              <Button variant="outline" size="lg" className="w-full h-20 flex flex-col items-center justify-center gap-2">
                <UserCog className="h-6 w-6" />
                <span className="text-base">Admin</span>
                <span className="text-xs text-muted-foreground">Manage Products & View Analytics</span>
              </Button>
            </Link>
            <Link href="/sales" passHref>
              <Button variant="outline" size="lg" className="w-full h-20 flex flex-col items-center justify-center gap-2">
                <User className="h-6 w-6" />
                <span className="text-base">Sales Agent</span>
                 <span className="text-xs text-muted-foreground">Record Sales Transactions</span>
              </Button>
            </Link>
          </div>
          <div className="pt-4 flex justify-center">
            <Link href="/dashboard" passHref>
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                Go to App <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
