'use client';

import * as React from 'react';
import type { SalesAgent } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle } from 'lucide-react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useRole } from '@/hooks/use-role';
import { Skeleton } from '../ui/skeleton';
import { createSalesAgent } from '@/lib/actions';

export default function UserList() {
  const firestore = useFirestore();
  const usersCollection = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: users, isLoading } = useCollection<Omit<SalesAgent, 'id'>>(usersCollection);

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();
  const { role } = useRole();

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (role !== 'admin') {
      toast({ variant: 'destructive', title: 'Permission Denied', description: 'Only admins can add users.' });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const newAgent: Omit<SalesAgent, 'id'> = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
    };

    const result = await createSalesAgent(newAgent);

    if (result.success) {
      toast({ title: 'User Created', description: result.message });
      setIsDialogOpen(false);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    setIsSubmitting(false);
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        {role === 'admin' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Sales Agent
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Sales Agent</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new sales agent account.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleFormSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="firstName" className="text-right">First Name</Label>
                    <Input id="firstName" name="firstName" className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="lastName" className="text-right">Last Name</Label>
                    <Input id="lastName" name="lastName" className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">Email</Label>
                    <Input id="email" name="email" type="email" className="col-span-3" required />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                  </DialogClose>
                  <Button type="submit" className="bg-accent hover:bg-accent/90" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Agent'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>First Name</TableHead>
              <TableHead>Last Name</TableHead>
              <TableHead>Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-6 w-32"/></TableCell>
                <TableCell><Skeleton className="h-6 w-32"/></TableCell>
                <TableCell><Skeleton className="h-6 w-48"/></TableCell>
              </TableRow>
            ))}
            {users && users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.firstName}</TableCell>
                <TableCell>{user.lastName}</TableCell>
                <TableCell>{user.email}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
         {(!users || users.length === 0) && !isLoading && (
          <div className="text-center p-8 text-muted-foreground">No users found. {role === 'admin' && 'Add a new sales agent to get started.'}</div>
        )}
      </div>
    </div>
  );
}
