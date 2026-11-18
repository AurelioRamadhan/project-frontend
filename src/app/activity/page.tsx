'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';

export default function ActivityPage() {
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await api.get('/api/projects')).data,
  });

  const firstProject = projects?.[0];

  const { data: logs } = useQuery({
    queryKey: ['audit-project', firstProject?.id],
    queryFn: async () => firstProject ? (await api.get(`/api/audit/project/${firstProject.id}`)).data : [],
    enabled: !!firstProject?.id,
  });

  return (
    <AppShell>
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Activity Logs</h1>
        <Card>
          <CardContent className="p-6 space-y-3">
            {logs?.map((l: any) => (
              <div key={l.id} className="border-l-2 border-blue-500 pl-3">
                <p className="text-sm font-medium">
                  {l.actor.name} · {l.changedColumn} · {l.task?.title}
                </p>
                <p className="text-xs text-slate-500">{l.oldValue || '-'} → {l.newValue || '-'}</p>
                <p className="text-xs text-slate-400">{new Date(l.timestamp).toLocaleString('id-ID')}</p>
              </div>
            ))}
            {logs?.length === 0 && <p className="text-slate-400">Belum ada aktivitas.</p>}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}