import UserList from '@/components/users/user-list';

export default function UsersPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">User Management</h1>
        <p className="text-muted-foreground">Add, view, and manage your sales agents.</p>
      </div>
      <UserList />
    </div>
  );
}
