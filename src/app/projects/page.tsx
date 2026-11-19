'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProjectDialog } from '@/components/ui/project-dialog';
import { ProjectCard } from '@/components/ui/project-card';
import { Pagination } from '@/components/ui/pagination';
import { Plus, Search } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest' },
  { value: 'createdAt:asc', label: 'Oldest' },
  { value: 'name:asc', label: 'Name A-Z' },
  { value: 'name:desc', label: 'Name Z-A' },
];

export default function ProjectsPage() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editProject, setEditProject] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('createdAt:desc');
  const [page, setPage] = useState(1);
  const rows = 9;

  const { data, isLoading } = useQuery({
    queryKey: ['projects', page, search, sort],
    queryFn: async () => {
      const [orderKey, orderRule] = sort.split(':');
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('rows', String(rows));
      params.set('orderKey', orderKey);
      params.set('orderRule', orderRule);
      if (search) params.set('searchFilters', JSON.stringify({ name: search }));
      return (await api.get(`/api/projects?${params.toString()}`)).data;
    },
  });

  const projects = data?.data || [];
  const meta = data?.meta;

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus project ini?')) return;
    await api.delete(`/api/projects/${id}`);
    qc.invalidateQueries({ queryKey: ['projects'] });
  };

  return (
    <AppShell>
      <div className="max-w-6xl">
        <div className="flex justify-between items-center mb-4 gap-3 flex-wrap">
          <h1 className="text-3xl font-bold">
            {user?.role === 'PM' ? 'Projects' : 'My Projects'}
          </h1>
          {user?.role === 'PM' && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={16} className="mr-1" /> Create Project
            </Button>
          )}
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-white flex-1 min-w-[200px]">
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search projects..."
              className="flex-1 text-sm outline-none"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm bg-white"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {isLoading && <p className="text-slate-400">Memuat...</p>}
        {!isLoading && projects.length === 0 && (
          <p className="text-slate-400">Tidak ada project.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p: any) => (
            <ProjectCard
              key={p.id}
              project={p}
              canEdit={user?.role === 'PM'}
              onEdit={() => setEditProject(p)}
              onDelete={() => handleDelete(p.id)}
            />
          ))}
        </div>

        <Pagination
          page={meta?.page || 1}
          totalPages={meta?.totalPages || 1}
          total={meta?.total || 0}
          onChange={setPage}
        />

        {user?.role === 'PM' && (
          <>
            <ProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
            {editProject && (
              <ProjectDialog
                open={!!editProject}
                onOpenChange={(v) => !v && setEditProject(null)}
                projectId={editProject.id}
                initial={{
                  name: editProject.name,
                  description: editProject.description || '',
                  startDate: editProject.startDate
                    ? editProject.startDate.slice(0, 10)
                    : '',
                  dueDate: editProject.dueDate ? editProject.dueDate.slice(0, 10) : '',
                  clientId: editProject.clientId || '',
                  memberIds: (editProject.members || []).map(
                    (m: any) => m.userId || m.user?.id
                  ),
                }}
              />
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}