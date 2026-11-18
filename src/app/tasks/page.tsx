'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function MyTasksPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get('/api/dashboard')).data,
  });

  return (
    <AppShell>
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">My Tasks</h1>
        {isLoading && <p className="text-slate-400">Memuat...</p>}
        {data?.tasks?.length === 0 && <p className="text-slate-400">Belum ada task.</p>}
        <div className="space-y-3">
          {data?.tasks?.map((t: any) => (
            <Link key={t.id} href={`/tasks/${t.id}`}>
              <Card className="hover:shadow-md transition">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{t.title}</p>
                    <p className="text-xs text-slate-500">{t.project.name}</p>
                  </div>
                  <Badge>{t.status}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}