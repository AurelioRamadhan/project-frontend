'use client';
import { AppShell } from '@/components/layout/app-shell';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent } from '@/components/ui/card';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  return (
    <AppShell>
      <div className="max-w-md">
        <h1 className="text-3xl font-bold mb-6">Profile</h1>
        <Card>
          <CardContent className="p-6 space-y-3">
            <div><p className="text-sm text-slate-500">Nama</p><p className="font-medium">{user?.name}</p></div>
            <div><p className="text-sm text-slate-500">Email</p><p className="font-medium">{user?.email}</p></div>
            <div><p className="text-sm text-slate-500">Role</p><p className="font-medium">{user?.role}</p></div>
            <div><p className="text-sm text-slate-500">Department</p><p className="font-medium">{user?.department}</p></div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}