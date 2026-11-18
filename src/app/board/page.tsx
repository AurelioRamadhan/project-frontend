'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';
import { Lock, Play, CheckCircle2 } from 'lucide-react';

const COLUMNS = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'];

export default function BoardPage() {
  const user = useAuthStore((s) => s.user);
  const search = useSearchParams();
  const qc = useQueryClient();
  const [projectId, setProjectId] = useState(search.get('projectId') || '');

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await api.get('/api/projects')).data,
  });

  useEffect(() => {
    if (!projectId && projects?.length > 0) setProjectId(projects[0].id);
  }, [projects, projectId]);

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => projectId ? (await api.get(`/api/tasks/project/${projectId}`)).data : [],
    enabled: !!projectId,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, version }: any) =>
      api.patch(`/api/tasks/${id}/status`, { status, version }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
    onError: (e: any) => alert(e.response?.data?.error || 'Gagal update status'),
  });

  return (
    <AppShell>
      <div className="max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Task Board</h1>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="border rounded-md p-2">
            <option value="">Pilih Project</option>
            {projects?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {isLoading && <p className="text-slate-400">Memuat...</p>}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const items = (tasks || []).filter((t: any) => (t.displayStatus || t.status) === col);
            return (
              <div key={col} className="bg-slate-100 rounded-lg p-3">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-sm">{col.replace('_', ' ')}</h3>
                  <Badge variant="secondary">{items.length}</Badge>
                </div>
                <div className="space-y-2">
                  {items.map((t: any) => (
                    <TaskCard key={t.id} task={t} user={user} onUpdate={updateStatus} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

function TaskCard({ task, user, onUpdate }: any) {
  const isAssignee = task.assigneeId === user?.id;
  const blocked = task.displayStatus === 'BLOCKED';
  const canStart = isAssignee && task.status === 'TODO' && !blocked;
  const canFinish = isAssignee && task.status === 'IN_PROGRESS';

  return (
    <Card>
      <CardContent className="p-3 space-y-2">
        <p className="font-medium text-sm">{task.title}</p>
        <div className="flex gap-1 flex-wrap">
          <Badge variant="outline" className="text-xs">{task.department}</Badge>
          <Badge variant={task.priority === 'HIGH' ? 'destructive' : 'secondary'} className="text-xs">{task.priority}</Badge>
        </div>
        {blocked && (
          <p className="text-xs text-red-600 flex items-center gap-1"><Lock size={12} /> Menunggu dependency selesai</p>
        )}
        {isAssignee && task.status === 'TODO' && (
          <Button size="sm" disabled={!canStart} onClick={() => onUpdate.mutate({ id: task.id, status: 'IN_PROGRESS', version: task.version })} className="w-full">
            <Play size={14} className="mr-1" /> {blocked ? 'Locked' : 'Start Task'}
          </Button>
        )}
        {canFinish && (
          <Button size="sm" onClick={() => onUpdate.mutate({ id: task.id, status: 'DONE', version: task.version })} className="w-full bg-green-600 hover:bg-green-700">
            <CheckCircle2 size={14} className="mr-1" /> Mark Done
          </Button>
        )}
      </CardContent>
    </Card>
  );
}