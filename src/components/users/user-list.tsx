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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { useUser } from '@/hooks/use-supabase-user';
import { useRole } from '@/hooks/use-supabase-role';
import { Skeleton } from '../ui/skeleton';
import { createUser, updateUser, deleteUser, fetchUsers } from '@/lib/actions-supabase';

export default function UserList() {
  const { user } = useUser();
  const { role, isLoading: isRoleLoading } = useRole();

  const [users, setUsers] = React.useState<SalesAgent[]>([]);
  const [isUsersLoading, setIsUsersLoading] = React.useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<SalesAgent | null>(null);
  const [selectedRole, setSelectedRole] = React.useState<'admin' | 'agent'>('agent');
  const { toast } = useToast();

  const isLoading = isRoleLoading || isUsersLoading;

  // Fetch users from Supabase
  React.useEffect(() => {
    async function loadUsers() {
      if (!user || role !== 'admin') {
        setUsers([]);
        setIsUsersLoading(false);
        return;
      }

      try {
        const result = await fetchUsers();
        if (result.success && result.users) {
          setUsers(result.users);
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: result.message || 'Failed to load users.',
          });
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsUsersLoading(false);
      }
    }

    loadUsers();
  }, [user, role, toast]);

  // Refetch users after changes
  const refetchUsers = React.useCallback(async () => {
    if (!user || role !== 'admin') return;

    try {
      const result = await fetchUsers();
      if (result.success && result.users) {
        setUsers(result.users);
      }
    } catch (error) {
      console.error('Error refetching users:', error);
    }
  }, [user, role]);

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (role !== 'admin') {
      toast({ variant: 'destructive', title: 'Permission Denied', description: 'Only admins can add users.' });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const newUser: Omit<SalesAgent, 'id'> = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
    };
    const password = formData.get('password') as string;
    const userRole = formData.get('role') as 'admin' | 'agent';

    // Validate password
    if (!password || password.length < 6) {
      toast({ variant: 'destructive', title: 'Invalid Password', description: 'Password must be at least 6 characters long.' });
      setIsSubmitting(false);
      return;
    }

    const result = await createUser(newUser, password, userRole);

    if (result.success) {
      toast({
        title: 'User Created',
        description: result.message,
        duration: 10000,
      });
      setIsCreateDialogOpen(false);
      (e.target as HTMLFormElement).reset();
      setSelectedRole('agent');
      await refetchUsers();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    setIsSubmitting(false);
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUser || role !== 'admin') return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const updates: Partial<SalesAgent> = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
    };
    const newRole = formData.get('role') as 'admin' | 'agent';

    const result = await updateUser(selectedUser.id, updates, newRole);

    if (result.success) {
      toast({ title: 'Success', description: result.message });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      await refetchUsers();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!selectedUser || role !== 'admin') return;

    setIsSubmitting(true);
    const result = await deleteUser(selectedUser.id);

    if (result.success) {
      toast({ title: 'Success', description: result.message });
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      await refetchUsers();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    setIsSubmitting(false);
  };

  return (
    <div>
      {/* Create User Dialog */}
      <div className="flex justify-end mb-4">
        {role === 'admin' && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new admin or sales agent account. The user will use these credentials to login.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit}>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        placeholder="John"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john.doe@example.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Minimum 6 characters"
                      minLength={6}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      This password will be shared with the user for login.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">User Role</Label>
                    <Select
                      name="role"
                      defaultValue={selectedRole}
                      onValueChange={(value) => setSelectedRole(value as 'admin' | 'agent')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agent">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Sales Agent
                            </span>
                            <span className="text-xs text-muted-foreground">- Can record sales</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Admin
                            </span>
                            <span className="text-xs text-muted-foreground">- Full access</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                  </DialogClose>
                  <Button type="submit" className="bg-accent hover:bg-accent/90" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create User'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and role.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-firstName">First Name</Label>
                    <Input
                      id="edit-firstName"
                      name="firstName"
                      defaultValue={selectedUser.firstName}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-lastName">Last Name</Label>
                    <Input
                      id="edit-lastName"
                      name="lastName"
                      defaultValue={selectedUser.lastName}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email Address</Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    defaultValue={selectedUser.email}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-role">User Role</Label>
                  <Select name="role" defaultValue={(selectedUser as any).role || 'agent'}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Sales Agent
                          </span>
                          <span className="text-xs text-muted-foreground">- Can record sales</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Admin
                          </span>
                          <span className="text-xs text-muted-foreground">- Full access</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Update User'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedUser?.firstName} {selectedUser?.lastName}'s account.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isSubmitting} className="bg-destructive hover:bg-destructive/90">
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>First Name</TableHead>
              <TableHead>Last Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              {role === 'admin' && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-6 w-32"/></TableCell>
                <TableCell><Skeleton className="h-6 w-32"/></TableCell>
                <TableCell><Skeleton className="h-6 w-48"/></TableCell>
                <TableCell><Skeleton className="h-6 w-24"/></TableCell>
                {role === 'admin' && <TableCell><Skeleton className="h-6 w-20"/></TableCell>}
              </TableRow>
            ))}
            {users && users.map((user) => {
              const userRole = (user as any).role || 'agent';
              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.firstName}</TableCell>
                  <TableCell>{user.lastName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      userRole === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {userRole === 'admin' ? 'Admin' : 'Sales Agent'}
                    </span>
                  </TableCell>
                  {role === 'admin' && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUser(user as SalesAgent);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUser(user as SalesAgent);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
         {(!users || users.length === 0) && !isLoading && (
          <div className="text-center p-8 text-muted-foreground">No users found. {role === 'admin' && 'Add a new user to get started.'}</div>
        )}
      </div>
    </div>
  );
}
