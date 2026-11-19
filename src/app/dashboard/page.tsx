'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth';
import {
  CheckSquare,
  FolderKanban,
  ListTodo,
  Lock,
  PlayCircle,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get('/api/dashboard')).data,
  });

  return (
    <AppShell>
      <div className="max-w-6xl">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Dashboard</h1>
        <p className="text-slate-500 mb-6">Selamat datang, {user?.name}</p>

        {isLoading && <p className="text-slate-400">Memuat...</p>}
        {error && <p className="text-red-500">Gagal memuat data dashboard.</p>}

        {data && user?.role === 'PM' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <StatCard
                icon={FolderKanban}
                label="Projects"
                value={data.totalProjects}
                color="blue"
              />
              <StatCard
                icon={ListTodo}
                label="Total Tasks"
                value={data.totalTasks}
                color="indigo"
              />
              <StatCard
                icon={PlayCircle}
                label="In Progress"
                value={data.inProgressTasks}
                color="amber"
              />
              <StatCard
                icon={CheckCircle2}
                label="Completed"
                value={data.completedTasks}
                color="green"
              />
              <StatCard icon={Lock} label="Blocked" value={data.blockedTasks} color="red" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.recentProjects?.length === 0 && (
                    <p className="text-slate-400">Belum ada project.</p>
                  )}
                  <div className="space-y-3">
                    {data.recentProjects?.map((p: any) => (
                      <Link key={p.id} href={`/projects/${p.id}`}>
                        <div className="flex items-center justify-between hover:bg-slate-50 rounded px-1 py-1">
                          <span className="text-sm font-medium truncate max-w-[60%]">
                            {p.name}
                          </span>
                          <div className="flex items-center gap-2 w-[35%]">
                            <div className="flex-1 h-2 bg-slate-100 rounded">
                              <div
                                className="h-2 bg-blue-500 rounded"
                                style={{ width: `${p.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500 w-12 text-right">
                              {p.done}/{p.total}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recently Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.recentCompleted?.length === 0 && (
                    <p className="text-slate-400">Belum ada task selesai.</p>
                  )}
                  <div className="space-y-2">
                    {data.recentCompleted?.map((t: any) => (
                      <Link key={t.id} href={`/tasks/${t.id}`}>
                        <div className="flex items-center gap-2 hover:bg-slate-50 rounded px-1 py-1">
                          <CheckCircle2 size={14} className="text-green-600 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{t.title}</p>
                            <p className="text-xs text-slate-400">
                              {t.projectName} · {t.assigneeName || '-'}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {data && user?.role === 'INTERNAL' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <StatCard icon={ListTodo} label="To Do" value={data.byStatus.TODO} color="slate" />
              <StatCard
                icon={PlayCircle}
                label="In Progress"
                value={data.byStatus.IN_PROGRESS}
                color="blue"
              />
              <StatCard
                icon={CheckCircle2}
                label="Completed"
                value={data.byStatus.DONE}
                color="green"
              />
              <StatCard icon={Lock} label="Blocked" value={data.blocked} color="red" />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Recently Completed</CardTitle>
              </CardHeader>
              <CardContent>
                {data.recentCompleted?.length === 0 && (
                  <p className="text-slate-400">Belum ada task selesai.</p>
                )}
                <div className="space-y-2">
                  {data.recentCompleted?.map((t: any) => (
                    <Link key={t.id} href={`/tasks/${t.id}`}>
                      <div className="flex items-center gap-2 hover:bg-slate-50 rounded px-1 py-1">
                        <CheckCircle2 size={14} className="text-green-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{t.title}</p>
                          <p className="text-xs text-slate-400">{t.projectName}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    slate: 'bg-slate-100 text-slate-700',
    amber: 'bg-amber-100 text-amber-700',
  };
  return (
    <Card>
      <CardContent className="p-6">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}
        >
          <Icon size={20} />
        </div>
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </CardContent>
    </Card>
  );
}