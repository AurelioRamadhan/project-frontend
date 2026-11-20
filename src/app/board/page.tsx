'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { AppShell } from '@/components/layout/app-shell';
import { Pagination } from '@/components/ui/pagination';
import { TaskCard } from '@/components/ui/task-card';
import { useAuthStore } from '@/store/auth';
import { Search } from 'lucide-react';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
const COLUMNS: { key: TaskStatus; label: string; accent: string }[] = [
  { key: 'TODO', label: 'TO DO', accent: 'border-slate-400' },
  { key: 'IN_PROGRESS', label: 'IN PROGRESS', accent: 'border-blue-500' },
  { key: 'DONE', label: 'DONE', accent: 'border-green-500' },
];

export default function BoardPage() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [dragId, setDragId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filterProject, setFilterProject] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterDepartment, setFilterDepartment] = useState('ALL');
  const [page, setPage] = useState(1);
  const rows = 60;

  const { data: projectsData } = useQuery({
    queryKey: ['projects', 'board'],
    queryFn: async () => (await api.get('/api/projects?rows=100')).data,
  });
  const projects = projectsData?.data || [];

  const { data: taskData, isLoading, error: taskError } = useQuery({
    queryKey: [
      'tasks-global',
      page,
      searchText,
      filterProject,
      filterPriority,
      filterDepartment,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('rows', String(rows));
      if (searchText) params.set('searchFilters', JSON.stringify({ title: searchText }));
      const filters: any = {};
      if (filterProject !== 'ALL') filters.projectId = filterProject;
      if (filterPriority !== 'ALL') filters.priority = filterPriority;
      if (filterDepartment !== 'ALL') filters.department = filterDepartment;
      if (Object.keys(filters).length) params.set('filters', JSON.stringify(filters));
      return (await api.get(`/api/tasks?${params.toString()}`)).data;
    },
  });

  const tasks = taskData?.data || [];
  const meta = taskData?.meta;

  const updateStatus = useMutation({
    mutationFn: async ({
      taskId,
      status,
      version,
    }: {
      taskId: string;
      status: TaskStatus;
      version: number;
    }) => api.patch(`/api/tasks/${taskId}/status`, { status, version }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks-global'] });
      qc.invalidateQueries({ queryKey: ['my-tasks'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['audit-global'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (e: unknown) => alert(getApiErrorMessage(e, 'Gagal mengubah status')),
  });

  const handleDrop = (status: TaskStatus) => {
    if (!dragId) return;
    const task = tasks.find((t: any) => t.id === dragId);
    setDragId(null);
    if (!task || task.status === status) return;
    if (user?.role !== 'INTERNAL' || task.assigneeId !== user?.id) {
      alert('Hanya eksekutor yang boleh mengubah status.');
      return;
    }
    if (task.isBlocked) {
      alert('Task masih blocked.');
      return;
    }
    updateStatus.mutate({ taskId: task.id, status, version: task.version });
  };

  return (
    <AppShell>
      <div className="max-w-7xl">
        <h1 className="text-3xl font-bold mb-4">Task Board (All Projects)</h1>

        <div className="flex gap-2 mb-4 flex-wrap">
          <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-white flex-1 min-w-[200px]">
            <Search size={16} className="text-slate-400" />
            <input
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setPage(1);
              }}
              placeholder="Cari task..."
              className="flex-1 text-sm outline-none"
            />
          </div>
          <select
            value={filterProject}
            onChange={(e) => {
              setFilterProject(e.target.value);
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
            value={filterPriority}
            onChange={(e) => {
              setFilterPriority(e.target.value);
              setPage(1);
            }}
            className="border rounded-md px-3 py-2 text-sm bg-white"
          >
            <option value="ALL">All Priority</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
          <select
            value={filterDepartment}
            onChange={(e) => {
              setFilterDepartment(e.target.value);
              setPage(1);
            }}
            className="border rounded-md px-3 py-2 text-sm bg-white"
          >
            <option value="ALL">All Dept</option>
            <option value="UIUX">UI/UX</option>
            <option value="FRONTEND">Frontend</option>
            <option value="BACKEND">Backend</option>
          </select>
        </div>

        {isLoading && <p className="text-slate-400" role="status">Memuat task...</p>}
        {taskError && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3" role="alert">{getApiErrorMessage(taskError, 'Gagal memuat task.')}</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {!isLoading && !taskError && COLUMNS.map((col) => {
            const items = tasks.filter((t: any) => t.status === col.key);
            return (
              <div
                key={col.key}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(col.key)}
                className="bg-slate-50 rounded-lg p-3 min-h-[300px]"
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className={`font-bold text-sm border-l-4 pl-2 ${col.accent}`}>
                    {col.label}
                  </h3>
                  <span className="text-xs text-slate-500">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((t: any) => {
                    const isAssignee = t.assigneeId === user?.id;
                    const draggable = isAssignee && !t.isBlocked;
                    return (
                      <div key={t.id}>
                        {filterProject === 'ALL' && t.project && (
                          <p className="text-[10px] text-slate-400 mb-1 truncate">
                            {t.project.name}
                          </p>
                        )}
                        <TaskCard
                          task={t}
                          draggable={draggable}
                          onDragStart={() => setDragId(t.id)}
                          showDependencyHint
                        />
                      </div>
                    );
                  })}
                  {items.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-6">Kosong</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

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