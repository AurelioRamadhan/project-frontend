'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useRef, useState, useMemo, useEffect } from 'react';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UserPicker } from '@/components/ui/user-picker';
import { colorFor, initials, formatDateTime } from '@/lib/format';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Eye,
  Flag,
  Play,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const [preview, setPreview] = useState<any>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    assigneeId: '',
    startDate: '',
    dueDate: '',
    isClientVisible: false,
    dependencyIds: [] as string[],
  });

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: async () => (await api.get(`/api/tasks/${id}`)).data,
  });

  const { data: attachments } = useQuery({
    queryKey: ['attachments', id],
    queryFn: async () => (await api.get(`/api/attachments/task/${id}`)).data,
  });

  const { data: logs } = useQuery({
    queryKey: ['audit', id],
    queryFn: async () => (await api.get(`/api/audit/task/${id}`)).data,
  });

  const projectTasks = useQuery({
    queryKey: ['tasks-for-dep', task?.projectId],
    queryFn: async () => {
      const r = await api.get(`/api/tasks/project/${task?.projectId}?rows=200`);
      return r.data.data;
    },
    enabled: !!task?.projectId,
  });

  useEffect(() => {
    if (!task) return;
    setForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      assigneeId: task.assigneeId || '',
      startDate: task.startDate ? task.startDate.slice(0, 10) : '',
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      isClientVisible: task.isClientVisible,
      dependencyIds: (task.dependencies || []).map((d: any) => d.dependsOnTaskId),
    });
  }, [task]);

  const isDirty = useMemo(() => {
    if (!task) return false;
    return (
      form.title !== task.title ||
      form.description !== (task.description || '') ||
      form.priority !== task.priority ||
      form.assigneeId !== (task.assigneeId || '') ||
      form.startDate !== (task.startDate ? task.startDate.slice(0, 10) : '') ||
      form.dueDate !== (task.dueDate ? task.dueDate.slice(0, 10) : '') ||
      form.isClientVisible !== task.isClientVisible ||
      JSON.stringify(form.dependencyIds.sort()) !==
        JSON.stringify(
          (task.dependencies || []).map((d: any) => d.dependsOnTaskId).sort()
        )
    );
  }, [form, task]);

  const updateStatus = useMutation({
    mutationFn: async ({ status, version }: { status: string; version: number }) =>
      api.patch(`/api/tasks/${id}/status`, { status, version }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task', id] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setMsg('Status berhasil diubah');
    },
    onError: (e: any) => setMsg(e.response?.data?.error || 'Gagal ubah status'),
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title: form.title,
        description: form.description || null,
        priority: form.priority,
        isClientVisible: form.isClientVisible,
        assigneeId: form.assigneeId || null,
        dependencyIds: form.dependencyIds,
        version: task.version,
      };
      payload.startDate = form.startDate
        ? new Date(form.startDate).toISOString()
        : null;
      payload.dueDate = form.dueDate ? new Date(form.dueDate).toISOString() : null;
      return api.put(`/api/tasks/${id}`, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task', id] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
      setMsg('Perubahan tersimpan');
    },
    onError: (e: any) => setMsg(e.response?.data?.error || 'Gagal simpan'),
  });

  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      const fd = new FormData();
      files.forEach((f) => fd.append('file', f));
      return api.post(`/api/attachments/task/${id}`, fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attachments', id] });
      qc.invalidateQueries({ queryKey: ['task', id] });
      if (fileRef.current) fileRef.current.value = '';
      setMsg('File berhasil diupload');
    },
    onError: (e: any) => setMsg(e.response?.data?.error || 'Gagal upload'),
  });

  const removeAttachment = useMutation({
    mutationFn: async (attId: string) => api.delete(`/api/attachments/${attId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attachments', id] });
      setMsg('File dihapus');
    },
    onError: (e: any) => setMsg(e.response?.data?.error || 'Gagal hapus'),
  });

  const token = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('token') || '';
  }, [task?.id]);

  if (isLoading || !task) {
    return (
      <AppShell>
        <p className="text-slate-400">Memuat task...</p>
      </AppShell>
    );
  }

  const isAssignee = task.assigneeId === user?.id;
  const canStart = isAssignee && task.status === 'TODO' && !task.isBlocked;
  const canFinish = isAssignee && task.status === 'IN_PROGRESS' && !task.isBlocked;
  const canRevert = isAssignee && task.status === 'DONE' && !task.isBlocked;
  const canUpload = user?.role === 'INTERNAL' && isAssignee && task.status !== 'DONE';
  const canEdit = user?.role === 'PM';
  const canDeleteAttachment = (a: any) =>
    user?.role === 'PM' || a.uploadedById === user?.id;

  const resetForm = () => {
    setForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      assigneeId: task.assigneeId || '',
      startDate: task.startDate ? task.startDate.slice(0, 10) : '',
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      isClientVisible: task.isClientVisible,
      dependencyIds: (task.dependencies || []).map((d: any) => d.dependsOnTaskId),
    });
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto py-6 space-y-5">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft size={16} className="mr-1" /> Back
          </Button>
          {canEdit && isDirty && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={resetForm}>
                Batal
              </Button>
              <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
                {save.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>Task</span>
          <span>·</span>
          <span>{task.project?.name}</span>
          {task.assignee && (
            <>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <span
                  className="w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center font-semibold"
                  style={{ backgroundColor: colorFor(task.assignee.id) }}
                >
                  {initials(task.assignee.name)}
                </span>
                {task.assignee.name}
              </span>
            </>
          )}
        </div>

        {canEdit ? (
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="text-2xl font-bold h-auto py-2"
          />
        ) : (
          <h1 className="text-3xl font-bold">{task.title}</h1>
        )}

        {msg && <p className="text-sm bg-blue-50 p-2 rounded text-blue-700">{msg}</p>}

        <div className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm">
          <FieldRow label="Status" icon={<CheckCircle2 size={15} />}>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusPicker
                status={task.status}
                disabled={!isAssignee || task.isBlocked}
                onChange={(status) => updateStatus.mutate({ status, version: task.version })}
              />
              {isAssignee && canStart && (
                <button
                  onClick={() =>
                    updateStatus.mutate({ status: 'IN_PROGRESS', version: task.version })
                  }
                  className="text-xs text-blue-600 hover:underline"
                >
                  Start
                </button>
              )}
              {isAssignee && canFinish && (
                <button
                  onClick={() => updateStatus.mutate({ status: 'DONE', version: task.version })}
                  className="text-xs text-green-600 hover:underline"
                >
                  Mark Done
                </button>
              )}
              {isAssignee && canRevert && (
                <button
                  onClick={() =>
                    updateStatus.mutate({ status: 'IN_PROGRESS', version: task.version })
                  }
                  className="text-xs text-amber-600 hover:underline"
                >
                  Reopen
                </button>
              )}
            </div>
          </FieldRow>

          <FieldRow label="Assignees" icon={<Users size={15} />}>
            {canEdit ? (
              <div className="max-w-xs">
                <UserPicker
                  mode="project-members"
                  projectId={task.projectId}
                  value={form.assigneeId ? [form.assigneeId] : []}
                  onChange={(ids) => setForm({ ...form, assigneeId: ids[0] || '' })}
                  multiple={false}
                  placeholder="Pilih assignee..."
                  allowDepartmentFilter
                />
              </div>
            ) : task.assignee ? (
              <span className="inline-flex items-center gap-2">
                <span
                  className="w-6 h-6 rounded-full text-white text-[10px] flex items-center justify-center font-semibold"
                  style={{ backgroundColor: colorFor(task.assignee.id) }}
                >
                  {initials(task.assignee.name)}
                </span>
                {task.assignee.name}
              </span>
            ) : (
              <span className="text-slate-400">Empty</span>
            )}
          </FieldRow>

          <FieldRow label="Dates" icon={<Calendar size={15} />}>
            {canEdit ? (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-[140px] h-8 text-xs"
                />
                <span className="text-slate-400">→</span>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-[140px] h-8 text-xs"
                />
              </div>
            ) : (
              <span>
                {task.startDate ? task.startDate.slice(0, 10) : '—'}
                {' → '}
                <span
                  className={
                    task.dueDate &&
                    new Date(task.dueDate) < new Date() &&
                    task.status !== 'DONE'
                      ? 'text-red-600'
                      : ''
                  }
                >
                  {task.dueDate ? task.dueDate.slice(0, 10) : '—'}
                </span>
              </span>
            )}
          </FieldRow>

          <FieldRow label="Priority" icon={<Flag size={15} />}>
            {canEdit ? (
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                className="border rounded px-2 py-1 text-sm w-[140px]"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            ) : (
              <span>{task.priority}</span>
            )}
          </FieldRow>

          <FieldRow label="Client Visible" icon={<Eye size={15} />}>
            {canEdit ? (
              <input
                type="checkbox"
                checked={form.isClientVisible}
                onChange={(e) => setForm({ ...form, isClientVisible: e.target.checked })}
              />
            ) : (
              <span>{task.isClientVisible ? 'Yes' : 'No'}</span>
            )}
          </FieldRow>
        </div>

        {canEdit ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Tambahkan deskripsi..."
              />
            </CardContent>
          </Card>
        ) : (
          task.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {task.description}
                </p>
              </CardContent>
            </Card>
          )
        )}

        {canEdit && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dependencies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-1">
                {(projectTasks.data || [])
                  .filter((t: any) => t.id !== task.id)
                  .map((t: any) => (
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
            </CardContent>
          </Card>
        )}

        {canUpload && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upload Attachments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input ref={fileRef} type="file" multiple />
              <Button
                onClick={() => {
                  const files = Array.from(fileRef.current?.files || []);
                  if (files.length) upload.mutate(files);
                }}
                disabled={upload.isPending}
              >
                <Upload size={14} className="mr-1" />
                {upload.isPending ? 'Uploading...' : 'Upload'}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Attachments ({attachments?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {attachments?.map((a: any) => {
                const isImage = a.mimeType?.startsWith('image/');
                const src = `${process.env.NEXT_PUBLIC_BE_URL}/api/attachments/${a.id}/preview?token=${token}`;
                return (
                  <div key={a.id} className="border rounded-lg overflow-hidden relative">
                    <div
                      className="h-32 bg-slate-100 flex items-center justify-center cursor-pointer overflow-hidden"
                      onClick={() => setPreview({ ...a, src })}
                    >
                      {isImage ? (
                        <img
                          src={src}
                          alt={a.originalName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-2">
                          <p className="text-xs font-mono break-all">{a.originalName}</p>
                          <p className="text-[10px] text-slate-400 mt-1">Click to preview</p>
                        </div>
                      )}
                    </div>
                    <div className="p-2 flex items-center justify-between gap-1">
                      <p className="text-xs truncate flex-1">{a.originalName}</p>
                      <button
                        onClick={() => setPreview({ ...a, src })}
                        className="p-1 text-slate-400 hover:text-blue-600"
                      >
                        <Eye size={14} />
                      </button>
                      {canDeleteAttachment(a) && (
                        <button
                          onClick={() => {
                            if (confirm('Hapus file?')) removeAttachment.mutate(a.id);
                          }}
                          className="p-1 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {attachments?.length === 0 && (
              <p className="text-slate-400 text-sm">Belum ada lampiran.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {logs?.map((l: any) => (
                <div key={l.id} className="text-sm border-l-2 border-blue-500 pl-3">
                  <p className="font-medium">
                    {l.actor.name} mengubah{' '}
                    <span className="font-mono">{l.changedColumn}</span>
                  </p>
                  <p className="text-slate-500 text-xs">
                    {l.oldValue || '(kosong)'} → {l.newValue || '(kosong)'}
                  </p>
                  <p className="text-slate-400 text-xs">{formatDateTime(l.timestamp)}</p>
                </div>
              ))}
              {logs?.length === 0 && (
                <p className="text-slate-400 text-sm">Belum ada aktivitas.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {preview && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto p-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreview(null)}
              className="absolute top-2 right-2 p-1 bg-white rounded shadow"
            >
              <X size={18} />
            </button>
            {preview.mimeType?.startsWith('image/') ? (
              <img
                src={preview.src}
                alt={preview.originalName}
                className="max-w-full max-h-[80vh]"
              />
            ) : preview.mimeType === 'application/pdf' ? (
              <iframe src={preview.src} className="w-[80vw] h-[80vh]" />
            ) : (
              <div className="p-10 text-center">
                <p className="text-sm text-slate-600">Preview tidak tersedia.</p>
                <a
                  href={`${process.env.NEXT_PUBLIC_BE_URL}/api/attachments/${preview.id}/download`}
                  className="text-blue-600 underline text-sm"
                >
                  Download file
                </a>
              </div>
            )}
            <p className="text-xs text-slate-500 mt-2 text-center">
              {preview.originalName}
            </p>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function FieldRow({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-center gap-3">
      <span className="text-slate-500 text-sm inline-flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function StatusPicker({
  status,
  disabled,
  onChange,
}: {
  status: string;
  disabled: boolean;
  onChange: (s: string) => void;
}) {
  const options = [
    { value: 'TODO', label: 'TO DO', color: '#8c95a2' },
    { value: 'IN_PROGRESS', label: 'IN PROGRESS', color: '#5f45e8' },
    { value: 'DONE', label: 'DONE', color: '#15803d' },
  ];
  const active = options.find((o) => o.value === status) || options[0];

  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="text-xs font-semibold rounded px-2 py-1 text-white border-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
      style={{ backgroundColor: active.color }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} style={{ color: '#000', background: '#fff' }}>
          {o.label}
        </option>
      ))}
    </select>
  );
}