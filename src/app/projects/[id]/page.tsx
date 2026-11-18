'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Lock, Trash2 } from 'lucide-react';

const STATUS_ORDER = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'] as const;

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const isPM = user?.role === 'PM';

  // ---------- Data project ----------
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await api.get('/api/projects')).data,
  });
  const project = projects?.find((p: any) => p.id === id);

  // ---------- Data task ----------
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', id],
    queryFn: async () => (await api.get(`/api/tasks/project/${id}`)).data,
    enabled: !!id,
  });

  // ---------- Anggota internal project (untuk pilihan assignee) ----------
  const members = (project?.members || []).filter(
    (m: any) => m.user && m.user.role === 'INTERNAL'
  );

  // ---------- Create task form ----------
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    department: 'FRONTEND' as 'UIUX' | 'FRONTEND' | 'BACKEND',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    assigneeId: '',
    startDate: '',
    dueDate: '',
    isClientVisible: false,
    dependencyIds: [] as string[],
  });

  const resetForm = () =>
    setForm({
      title: '',
      description: '',
      department: 'FRONTEND',
      priority: 'MEDIUM',
      assigneeId: '',
      startDate: '',
      dueDate: '',
      isClientVisible: false,
      dependencyIds: [],
    });

  const createTask = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title: form.title,
        description: form.description || undefined,
        department: form.department,
        priority: form.priority,
        isClientVisible: form.isClientVisible,
        assigneeId: form.assigneeId || undefined,
        dependencyIds: form.dependencyIds.length ? form.dependencyIds : undefined,
      };
      if (form.startDate) payload.startDate = new Date(form.startDate).toISOString();
      if (form.dueDate) payload.dueDate = new Date(form.dueDate).toISOString();
      return api.post(`/api/tasks/project/${id}`, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', id] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setOpen(false);
      resetForm();
    },
    onError: (e: any) => alert(e.response?.data?.error || 'Gagal membuat task'),
  });

  // ---------- Delete project (soft) ----------
  const deleteProject = useMutation({
    mutationFn: async () => api.delete(`/api/projects/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      router.push('/projects');
    },
    onError: (e: any) => alert(e.response?.data?.error || 'Gagal menghapus project'),
  });

  // ---------- Statistik ----------
  const all = tasks || [];
  const done = all.filter((t: any) => t.status === 'DONE').length;
  const progress = all.length ? Math.round((done / all.length) * 100) : 0;

  // Assignee filter per department
  const assigneeOptions = members.filter(
    (m: any) => m.user.department === form.department
  );

  return (
    <AppShell>
      <div className="max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {project?.name || 'Memuat project...'}
            </h1>
            {project?.description && (
              <p className="text-slate-500 mt-1 max-w-2xl">{project.description}</p>
            )}
            {project?.client && (
              <p className="text-sm text-slate-400 mt-1">
                Client: {project.client.name}
              </p>
            )}
          </div>
          {isPM && project && (
            <div className="flex gap-2">
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button>+ Create Task</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Task Title *</Label>
                      <Input
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        rows={3}
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Department</Label>
                        <select
                          className="w-full border rounded-md p-2"
                          value={form.department}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              department: e.target.value as any,
                              assigneeId: '',
                            })
                          }
                        >
                          <option value="UIUX">UI/UX</option>
                          <option value="FRONTEND">Frontend</option>
                          <option value="BACKEND">Backend</option>
                        </select>
                      </div>
                      <div>
                        <Label>Priority</Label>
                        <select
                          className="w-full border rounded-md p-2"
                          value={form.priority}
                          onChange={(e) =>
                            setForm({ ...form, priority: e.target.value as any })
                          }
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <Label>Assignee</Label>
                      <select
                        className="w-full border rounded-md p-2"
                        value={form.assigneeId}
                        onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
                      >
                        <option value="">— Pilih assignee —</option>
                        {assigneeOptions.map((m: any) => (
                          <option key={m.user.id} value={m.user.id}>
                            {m.user.name} ({m.user.department})
                          </option>
                        ))}
                      </select>
                      {assigneeOptions.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">
                          Belum ada anggota departemen ini di project.
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={form.startDate}
                          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Due Date</Label>
                        <Input
                          type="date"
                          value={form.dueDate}
                          onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Dependencies (task harus selesai dulu)</Label>
                      <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-1">
                        {all.length === 0 && (
                          <p className="text-xs text-slate-400">Belum ada task lain.</p>
                        )}
                        {all.map((t: any) => (
                          <label key={t.id} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={form.dependencyIds.includes(t.id)}
                              onChange={(e) => {
                                const set = new Set(form.dependencyIds);
                                e.target.checked ? set.add(t.id) : set.delete(t.id);
                                setForm({ ...form, dependencyIds: Array.from(set) });
                              }}
                            />
                            {t.title}
                          </label>
                        ))}
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.isClientVisible}
                        onChange={(e) =>
                          setForm({ ...form, isClientVisible: e.target.checked })
                        }
                      />
                      Client Visibility (task dapat dilihat client)
                    </label>
                    <Button
                      className="w-full"
                      disabled={!form.title || createTask.isPending}
                      onClick={() => createTask.mutate()}
                    >
                      {createTask.isPending ? 'Menyimpan...' : 'Simpan Task'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm('Hapus project ini (soft delete)?')) deleteProject.mutate();
                }}
              >
                <Trash2 size={16} className="mr-1" /> Hapus
              </Button>
            </div>
          )}
        </div>

        {/* Progress */}
        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Project Progress</span>
              <span className="font-bold">{progress}%</span>
            </div>
            <Progress value={progress} />
            <div className="flex gap-4 text-xs text-slate-500">
              <span>Total: {all.length} task</span>
              <span>Selesai: {done}</span>
              <span>Blocked: {all.filter((t: any) => t.displayStatus === 'BLOCKED').length}</span>
            </div>
          </CardContent>
        </Card>

        {/* Task list per status */}
        {tasksLoading && <p className="text-slate-400">Memuat task...</p>}
        {!tasksLoading && all.length === 0 && (
          <p className="text-slate-400">Belum ada task. {isPM && 'Klik "Create Task" untuk menambah.'}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATUS_ORDER.map((status) => {
            const items = all.filter((t: any) => (t.displayStatus || t.status) === status);
            return (
              <div key={status} className="bg-slate-100 rounded-lg p-3">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-sm">{status.replace('_', ' ')}</h3>
                  <Badge variant="secondary">{items.length}</Badge>
                </div>
                <div className="space-y-2">
                  {items.map((t: any) => (
                    <Card key={t.id}>
                      <CardContent className="p-3 space-y-2">
                        <p className="font-medium text-sm">{t.title}</p>
                        <div className="flex gap-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">{t.department}</Badge>
                          <Badge
                            variant={t.priority === 'HIGH' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {t.priority}
                          </Badge>
                          {t.isClientVisible && (
                            <Badge variant="outline" className="text-xs">Client</Badge>
                          )}
                        </div>
                        {t.assignee && (
                          <p className="text-xs text-slate-500">👤 {t.assignee.name}</p>
                        )}
                        {t.displayStatus === 'BLOCKED' && (
                          <p className="text-xs text-red-600 flex items-center gap-1">
                            <Lock size={12} />
                            {t.dependencies
                              ?.filter((d: any) => d.dependsOnTask.status !== 'DONE')
                              .map((d: any) => d.dependsOnTask.title)
                              .join(', ')}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {items.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4">Kosong</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}