'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';

export default function TeamPage() {
  const { data } = useQuery({
    queryKey: ['team'],
    queryFn: async () => {
      const res = await api.get('/api/projects');
      const members = new Map();
      res.data.forEach((p: any) => p.members?.forEach((m: any) => members.set(m.user.id, m.user)));
      return Array.from(members.values());
    },
  });

  return (
    <AppShell>
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Team Members</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.map((u: any) => (
            <Card key={u.id}>
              <CardContent className="p-4">
                <p className="font-medium">{u.name}</p>
                <p className="text-sm text-slate-500">{u.email}</p>
                <p className="text-xs text-slate-400 mt-1">{u.department}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}