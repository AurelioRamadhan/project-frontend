'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function ClientPortalPage() {
  const { data: dash } = useQuery({
    queryKey: ['client-dashboard'],
    queryFn: async () => (await api.get('/api/dashboard')).data,
  });

  const project = dash?.projects?.[0];

  const { data: metrics } = useQuery({
    queryKey: ['client-metrics', project?.id],
    queryFn: async () => project ? (await api.get(`/api/client/projects/${project.id}/metrics`)).data : null,
    enabled: !!project?.id,
  });

  return (
    <AppShell>
      <div className="max-w-4xl space-y-6">
        <h1 className="text-3xl font-bold">Client Portal</h1>
        {!project && <p className="text-slate-400">Belum ada project.</p>}
        {metrics && (
          <>
            <Card>
              <CardHeader><CardTitle>{metrics.projectName}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Overall Progress</span>
                    <span className="font-bold">{metrics.percentComplete}%</span>
                  </div>
                  <Progress value={metrics.percentComplete} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded text-center">
                    <p className="text-2xl font-bold text-green-700">{metrics.doneTasks}</p>
                    <p className="text-sm text-green-600">Completed</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded text-center">
                    <p className="text-2xl font-bold text-slate-700">{metrics.remainingTasks}</p>
                    <p className="text-sm text-slate-600">Remaining</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Visible Tasks</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics.tasks?.map((t: any) => (
                    <div key={t.id} className="flex justify-between items-center p-2 border-b">
                      <span className="text-sm">{t.title}</span>
                      <Badge>{t.status}</Badge>
                    </div>
                  ))}
                  {metrics.tasks?.length === 0 && <p className="text-slate-400 text-sm">Belum ada task yang dipublikasikan.</p>}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}