'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatDate } from '@/lib/format';
import { Calendar, FolderKanban } from 'lucide-react';

export default function ClientPortalPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['client-dashboard'],
    queryFn: async () => (await api.get('/api/dashboard')).data,
  });

  const projects = data?.projects || [];

  return (
    <AppShell>
      <div className="max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Client Portal</h1>
          <p className="text-slate-500 mt-1">
            Project yang Anda ikuti dan progress terbarunya.
          </p>
        </div>

        {isLoading && <p className="text-slate-400">Memuat...</p>}
        {!isLoading && projects.length === 0 && (
          <p className="text-slate-400">Belum ada project.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p: any) => (
            <Card key={p.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start gap-2">
                  <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                    <FolderKanban size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg line-clamp-1">{p.name}</CardTitle>
                    {p.description && (
                      <p className="text-sm text-slate-500 line-clamp-2 mt-1">
                        {p.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 flex-1">
                {(p.startDate || p.dueDate) && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar size={13} />
                    <span>
                      {p.startDate ? formatDate(p.startDate) : '—'}
                      {' → '}
                      <span
                        className={
                          p.dueDate && new Date(p.dueDate) < new Date() && p.progress < 100
                            ? 'text-red-600'
                            : ''
                        }
                      >
                        {p.dueDate ? formatDate(p.dueDate) : '—'}
                      </span>
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>Progress</span>
                    <span className="font-bold">{p.progress}%</span>
                  </div>
                  <Progress value={p.progress} />
                  <p className="text-[11px] text-slate-400 mt-1">
                    {p.doneTasks}/{p.totalTasks} task selesai
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-green-50 p-3 rounded text-center">
                    <p className="text-xl font-bold text-green-700">{p.doneTasks}</p>
                    <p className="text-[11px] text-green-600">Completed</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded text-center">
                    <p className="text-xl font-bold text-slate-700">
                      {p.totalTasks - p.doneTasks}
                    </p>
                    <p className="text-[11px] text-slate-600">Remaining</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-slate-600">Visible Tasks</p>
                  {p.tasks?.slice(0, 5).map((t: any) => (
                    <Link key={t.id} href={`/tasks/${t.id}`}>
                      <div className="flex justify-between items-center px-2 py-1 border-b border-slate-100 hover:bg-slate-50 rounded">
                        <span className="text-xs truncate max-w-[65%]">{t.title}</span>
                        <Badge
                          variant={t.status === 'DONE' ? 'default' : 'secondary'}
                          className="text-[10px]"
                        >
                          {t.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                  {p.tasks?.length === 0 && (
                    <p className="text-[11px] text-slate-400">Belum ada task dipublikasikan.</p>
                  )}
                  {p.tasks?.length > 5 && (
                    <p className="text-[11px] text-slate-400 text-right">
                      +{p.tasks.length - 5} lainnya
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}