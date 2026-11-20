'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { Search } from 'lucide-react';
import { formatAuditColumn, formatAuditValue, formatDateTime } from '@/lib/format';

export default function ActivityPage() {
  const [projectId, setProjectId] = useState('ALL');
  const [search, setSearch] = useState('');
  const [actorRole, setActorRole] = useState('ALL');
  const [page, setPage] = useState(1);
  const rows = 20;

  const { data: projectsData, error: projectsError } = useQuery({
    queryKey: ['projects', 'activity'],
    queryFn: async () => (await api.get('/api/projects?rows=100')).data,
  });
  const projects = projectsData?.data || [];

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-global', page, search, actorRole, projectId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('rows', String(rows));
      if (search) params.set('q', search);
      if (actorRole !== 'ALL') params.set('actorRole', actorRole);
      if (projectId !== 'ALL') params.set('projectId', projectId);
      return (await api.get(`/api/audit?${params.toString()}`)).data;
    },
  });

  const logs = data?.data || [];
  const meta = data?.meta;

  return (
    <AppShell>
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold mb-4">Activity Logs</h1>

        <div className="flex gap-2 mb-4 flex-wrap">
          <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-white flex-1 min-w-[200px]">
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari aktivitas..."
              className="flex-1 text-sm outline-none"
            />
          </div>
          <select
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value);
              setPage(1);
            }}
            className="border rounded-md px-3 py-2 text-sm bg-white"
          >
            <option value="ALL">All Projects</option>
            {projects.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={actorRole}
            onChange={(e) => {
              setActorRole(e.target.value);
              setPage(1);
            }}
            className="border rounded-md px-3 py-2 text-sm bg-white"
          >
            <option value="ALL">All Actors</option>
            <option value="PM">PM</option>
            <option value="INTERNAL">Internal</option>
          </select>
        </div>

        <Card>
          <CardContent className="p-6 space-y-3">
            {isLoading && <p className="text-slate-400" role="status">Memuat aktivitas...</p>}
            {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3" role="alert">Gagal memuat Activity Log. Periksa koneksi atau izin akses lalu coba lagi.</p>}
            {projectsError && <p className="text-sm text-amber-700" role="alert">Daftar project gagal dimuat.</p>}
            {!isLoading && !error && logs.map((l: any) => (
              <div key={l.id} className="border-l-2 border-blue-500 pl-3">
                <p className="text-sm font-medium">
                  {l.actor.name} · {formatAuditColumn(l.changedColumn)} · {l.task?.title}
                </p>
                {l.task?.project && (
                  <p className="text-xs text-slate-400 mt-0.5">{l.task.project.name}</p>
                )}
                <p className="text-xs text-slate-500">
                  {formatAuditValue(l.changedColumn, l.oldValue)} → {formatAuditValue(l.changedColumn, l.newValue)}
                </p>
                <p className="text-xs text-slate-400">{formatDateTime(l.timestamp)}</p>
              </div>
            ))}
            {!isLoading && !error && logs.length === 0 && (
              <p className="text-slate-400">Belum ada aktivitas.</p>
            )}
          </CardContent>
        </Card>

        <Pagination
          page={meta?.page || 1}
          totalPages={meta?.totalPages || 1}
          total={meta?.total || 0}
          onChange={setPage}
        />
      </div>
    </AppShell>
  );
}