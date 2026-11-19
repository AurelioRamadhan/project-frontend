'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Suspense, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ProjectDialog } from '@/components/ui/project-dialog';
import { TaskDialog } from '@/components/ui/task-dialog';
import { TaskCard } from '@/components/ui/task-card';
import { Pagination } from '@/components/ui/pagination';
import { ArrowLeft, Pencil, Plus, Search } from 'lucide-react';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
const COLUMNS: { key: TaskStatus; label: string; accent: string }[] = [
  { key: 'TODO', label: 'TO DO', accent: 'border-slate-400' },
  { key: 'IN_PROGRESS', label: 'IN PROGRESS', accent: 'border-blue-500' },
  { key: 'DONE', label: 'DONE', accent: 'border-green-500' },
];

export default function ProjectDetailPage() {
  return (
    <Suspense fallback={<AppShell><p className="p-6 text-slate-400">Memuat project...</p></AppShell>}>
      <ProjectDetailContent />
    </Suspense>
  );
}

function ProjectDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const isPM = user?.role === 'PM';

  const [editProject, setEditProject] = useState(false);
  const [createTask, setCreateTask] = useState(false);
  const [editTask, setEditTask] = useState<any>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterDepartment, setFilterDepartment] = useState('ALL');
  const [page, setPage] = useState(1);
  const rows = 20;

  const { data: projectData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await api.get('/api/projects?rows=100')).data,
  });
  const project = projectData?.data?.find((p: any) => p.id === id);

  const { data: taskData, isLoading } = useQuery({
    queryKey: ['tasks', id, page, search, filterPriority, filterDepartment],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('rows', String(rows));
      params.set('orderKey', 'createdAt');
      params.set('orderRule', 'desc');
      if (search) params.set('searchFilters', JSON.stringify({ title: search }));
      const filters: any = {};
      if (filterPriority !== 'ALL') filters.priority = filterPriority;
      if (filterDepartment !== 'ALL') filters.department = filterDepartment;
      if (Object.keys(filters).length) params.set('filters', JSON.stringify(filters));
      return (await api.get(`/api/tasks/project/${id}?${params.toString()}`)).data;
    },
    enabled: !!id,
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
      qc.invalidateQueries({ queryKey: ['tasks', id] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e: any) => alert(e.response?.data?.error || 'Gagal ubah status'),
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

  const done = tasks.filter((t: any) => t.status === 'DONE').length;
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  const editInitial = useMemo(() => {
    if (!project) return undefined;
    return {
      name: project.name,
      description: project.description || '',
      startDate: project.startDate ? project.startDate.slice(0, 10) : '',
      dueDate: project.dueDate ? project.dueDate.slice(0, 10) : '',
      clientId: project.clientId || '',
      memberIds: (project.members || []).map((m: any) => m.userId || m.user?.id),
    };
  }, [project]);

  const taskEditInitial = useMemo(() => {
    if (!editTask) return undefined;
    return {
      title: editTask.title,
      description: editTask.description || '',
      priority: editTask.priority,
      assigneeId: editTask.assigneeId || '',
      startDate: editTask.startDate ? editTask.startDate.slice(0, 10) : '',
      dueDate: editTask.dueDate ? editTask.dueDate.slice(0, 10) : '',
      isClientVisible: editTask.isClientVisible,
      dependencyIds: (editTask.dependencies || []).map((d: any) => d.dependsOnTaskId),
    };
  }, [editTask]);

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Hapus task ini?')) return;
    await api.delete(`/api/tasks/${taskId}`);
    qc.invalidateQueries({ queryKey: ['tasks', id] });
  };

  return (
    <AppShell>
      <div className="max-w-7xl space-y-5">
        <Button variant="outline" size="sm" onClick={() => router.push('/projects')}>
          <ArrowLeft size={16} className="mr-1" /> Back
        </Button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">{project?.name || 'Memuat...'}</h1>
            {project?.description && (
              <p className="text-slate-500 mt-1 max-w-2xl">{project.description}</p>
            )}
            {project?.client && (
              <p className="text-sm text-slate-400 mt-1">Client: {project.client.name}</p>
            )}
          </div>
          {isPM && project && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditProject(true)}>
                <Pencil size={16} className="mr-1" /> Edit Project
              </Button>
              <Button onClick={() => setCreateTask(true)}>
                <Plus size={16} className="mr-1" /> Create Task
              </Button>
            </div>
          )}
        </div>

        <div className="bg-white border rounded-lg p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Project Progress</span>
            <span className="font-bold">{progress}%</span>
          </div>
          <Progress value={progress} />
          <div className="flex gap-4 text-xs text-slate-500">
            <span>Total: {tasks.length} task</span>
            <span>Selesai: {done}</span>
            <span>Blocked: {tasks.filter((t: any) => t.isBlocked).length}</span>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-white flex-1 min-w-[200px]">
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search tasks..."
              className="flex-1 text-sm outline-none"
            />
          </div>
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

        {isLoading && <p className="text-slate-400">Memuat task...</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
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
                      <TaskCard
                        key={t.id}
                        task={t}
                        draggable={draggable}
                        onDragStart={() => setDragId(t.id)}
                        showDependencyHint
                        canEdit={isPM}
                        onEdit={() => setEditTask(t)}
                        onDelete={isPM ? () => handleDeleteTask(t.id) : undefined}
                      />
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

        {isPM && project && (
          <>
            <ProjectDialog
              open={editProject}
              onOpenChange={setEditProject}
              projectId={project.id}
              initial={editInitial}
            />
            <TaskDialog
              open={createTask}
              onOpenChange={setCreateTask}
              projectId={id}
              allTasks={tasks}
            />
            {editTask && (
              <TaskDialog
                open={!!editTask}
                onOpenChange={(v) => !v && setEditTask(null)}
                projectId={id}
                taskId={editTask.id}
                allTasks={tasks}
                initial={taskEditInitial}
                version={editTask.version}
              />
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}