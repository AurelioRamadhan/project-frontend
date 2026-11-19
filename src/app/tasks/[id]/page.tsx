'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UserPicker } from '@/components/ui/user-picker';
import { FileTypeIcon } from '@/components/file-type-icon';
import {
  isImage,
  isPdf,
  isPreviewable,
  mimeLabel,
  previewUrl,
} from '@/lib/attachments';
import { colorFor, initials, formatDate, formatDateTime } from '@/lib/format';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Download,
  Eye,
  Flag,
  Lock,
  Play,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';

type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
type Status = 'TODO' | 'IN_PROGRESS' | 'DONE';

const STATUS_OPTIONS: { value: Status; label: string; color: string }[] = [
  { value: 'TODO', label: 'TO DO', color: '#64748b' },
  { value: 'IN_PROGRESS', label: 'IN PROGRESS', color: '#4f46e5' },
  { value: 'DONE', label: 'DONE', color: '#15803d' },
];

const PRIORITY_COLOR: Record<Priority, string> = {
  LOW: 'border-slate-200 text-slate-600 bg-white',
  MEDIUM: 'border-amber-200 text-amber-700 bg-amber-50',
  HIGH: 'border-red-200 text-red-600 bg-red-50',
};

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'info' | 'error'>('info');
  const [preview, setPreview] = useState<any>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as Priority,
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
      const r = await api.get(
        `/api/tasks/project/${task?.projectId}?rows=200`
      );
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
      dependencyIds: (task.dependencies || []).map(
        (d: any) => d.dependsOnTaskId
      ),
    });
  }, [task]);

  const isDirty = useMemo(() => {
    if (!task) return false;

    const sortedFormDeps = [...form.dependencyIds].sort().join(',');
    const sortedTaskDeps = [...(task.dependencies || [])]
      .map((d: any) => d.dependsOnTaskId)
      .sort()
      .join(',');

    return (
      form.title !== task.title ||
      form.description !== (task.description || '') ||
      form.priority !== task.priority ||
      form.assigneeId !== (task.assigneeId || '') ||
      form.startDate !==
        (task.startDate ? task.startDate.slice(0, 10) : '') ||
      form.dueDate !== (task.dueDate ? task.dueDate.slice(0, 10) : '') ||
      form.isClientVisible !== task.isClientVisible ||
      sortedFormDeps !== sortedTaskDeps
    );
  }, [form, task]);

  const notify = (
    text: string,
    type: 'info' | 'error' = 'info'
  ) => {
    setMsg(text);
    setMsgType(type);
  };

  // Jika Start Date melewati Due Date, Due Date otomatis mengikuti Start Date.
  const handleStartDateChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      startDate: value,
      dueDate:
        value && prev.dueDate && prev.dueDate < value
          ? value
          : prev.dueDate,
    }));
  };

  // Due Date tidak boleh lebih awal daripada Start Date.
  const handleDueDateChange = (value: string) => {
    if (value && form.startDate && value < form.startDate) {
      notify('Due Date tidak boleh lebih awal dari Start Date.', 'error');
      return;
    }

    setForm((prev) => ({ ...prev, dueDate: value }));
  };

  const updateStatus = useMutation({
    mutationFn: async ({
      status,
      version,
    }: {
      status: Status;
      version: number;
    }) =>
      api.patch(`/api/tasks/${id}/status`, { status, version }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task', id] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      notify('Status berhasil diubah');
    },
    onError: (e: any) =>
      notify(e.response?.data?.error || 'Gagal ubah status', 'error'),
  });

  const save = useMutation({
    mutationFn: async () => {
      if (
        form.startDate &&
        form.dueDate &&
        form.dueDate < form.startDate
      ) {
        throw new Error('Due Date tidak boleh lebih awal dari Start Date.');
      }

      const payload = {
        title: form.title,
        description: form.description || null,
        priority: form.priority,
        isClientVisible: form.isClientVisible,
        assigneeId: form.assigneeId || null,
        dependencyIds: form.dependencyIds,
        version: task.version,
        startDate: form.startDate
          ? new Date(`${form.startDate}T00:00:00`).toISOString()
          : null,
        dueDate: form.dueDate
          ? new Date(`${form.dueDate}T00:00:00`).toISOString()
          : null,
      };

      return api.put(`/api/tasks/${id}`, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task', id] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
      notify('Perubahan berhasil disimpan');
    },
    onError: (e: any) =>
      notify(
        e.response?.data?.error || e.message || 'Gagal simpan',
        'error'
      ),
  });

  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      const fd = new FormData();
      files.forEach((f) => fd.append('file', f));

      return api.post(`/api/attachments/task/${id}/batch`, fd);
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['attachments', id] });
      qc.invalidateQueries({ queryKey: ['task', id] });

      if (fileRef.current) fileRef.current.value = '';

      notify(`${res.data.length} file berhasil diupload`);
    },
    onError: (e: any) =>
      notify(e.response?.data?.error || 'Gagal upload', 'error'),
  });

  const removeAttachment = useMutation({
    mutationFn: async (attId: string) =>
      api.delete(`/api/attachments/${attId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attachments', id] });
      notify('Attachment berhasil dihapus');
    },
    onError: (e: any) =>
      notify(e.response?.data?.error || 'Gagal hapus', 'error'),
  });

  const download = async (att: any) => {
    try {
      const res = await api.get(
        `/api/attachments/${att.id}/download`,
        { responseType: 'blob' }
      );

      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');

      a.href = url;
      a.download = att.originalName;
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } catch (e: any) {
      notify(
        e?.response?.data?.error || 'Gagal download',
        'error'
      );
    }
  };

  if (isLoading || !task) {
    return (
      <AppShell>
        <div className="max-w-5xl mx-auto p-6">
          <p className="text-slate-400">Memuat task...</p>
        </div>
      </AppShell>
    );
  }

  const isAssignee = task.assigneeId === user?.id;
  const isBlocked = task.isBlocked;

  const canStart =
    isAssignee && task.status === 'TODO' && !isBlocked;

  const canFinish =
    isAssignee && task.status === 'IN_PROGRESS' && !isBlocked;

  const canRevert =
    isAssignee && task.status === 'DONE' && !isBlocked;

  const canUpload =
    user?.role === 'INTERNAL' &&
    isAssignee &&
    task.status !== 'DONE';

  const canEdit = user?.role === 'PM';

  const canDeleteAttachment = (a: any) =>
    (user?.role === 'PM' || a.uploadedById === user?.id) &&
    task.status !== 'DONE';

  const previewable = (attachments || []).filter(
    (a: any) => isPreviewable(a.mimeType)
  );

  const others = (attachments || []).filter(
    (a: any) => !isPreviewable(a.mimeType)
  );

  const blockedDeps = (task.dependencies || []).filter(
    (d: any) => d.dependsOnTask?.status !== 'DONE'
  );

  const activeStatus =
    STATUS_OPTIONS.find((o) => o.value === task.status) ||
    STATUS_OPTIONS[0];

  const resetForm = () => {
    setForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      assigneeId: task.assigneeId || '',
      startDate: task.startDate
        ? task.startDate.slice(0, 10)
        : '',
      dueDate: task.dueDate
        ? task.dueDate.slice(0, 10)
        : '',
      isClientVisible: task.isClientVisible,
      dependencyIds: (task.dependencies || []).map(
        (d: any) => d.dependsOnTaskId
      ),
    });
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">

        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="-ml-2"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back
          </Button>

          {canEdit && isDirty && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetForm}
              >
                Batal
              </Button>

              <Button
                size="sm"
                onClick={() => save.mutate()}
                disabled={save.isPending}
              >
                <Save size={14} className="mr-1" />
                {save.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          )}
        </div>

        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
            <span className="px-2 py-0.5 bg-slate-100 rounded font-medium">
              TASK
            </span>
            <span>/</span>
            <span>{task.project?.name}</span>

            {task.assignee && (
              <>
                <span>/</span>
                <span className="inline-flex items-center gap-1">
                  <span
                    className="w-4 h-4 rounded-full text-white text-[9px] flex items-center justify-center font-semibold"
                    style={{
                      backgroundColor: colorFor(task.assignee.id),
                    }}
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
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
              className="text-2xl md:text-3xl font-bold h-auto py-2 border-0 px-0 focus-visible:ring-0 shadow-none"
              placeholder="Task title"
            />
          ) : (
            <h1 className="text-2xl md:text-3xl font-bold">
              {task.title}
            </h1>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-white"
              style={{ backgroundColor: activeStatus.color }}
            >
              <CheckCircle2 size={12} />
              {activeStatus.label}
            </span>

            <span className="inline-flex items-center gap-1 px-2 py-1 border border-slate-200 rounded-md text-xs text-slate-600 bg-white">
              {task.department}
            </span>

            <span
              className={`inline-flex items-center gap-1 px-2 py-1 border rounded-md text-xs ${
                PRIORITY_COLOR[task.priority as Priority]
              }`}
            >
              <Flag size={12} />
              {task.priority}
            </span>

            {task.isClientVisible && (
              <span className="inline-flex items-center gap-1 px-2 py-1 border border-slate-200 rounded-md text-xs text-slate-600 bg-white">
                <Eye size={12} />
                Client Visible
              </span>
            )}

            {isBlocked && (
              <span className="inline-flex items-center gap-1 px-2 py-1 border border-red-200 rounded-md text-xs text-red-600 bg-red-50">
                <Lock size={12} />
                Blocked
              </span>
            )}
          </div>
        </div>

        {/* Notification */}
        {msg && (
          <div
            className={`text-sm p-3 rounded-md flex items-start justify-between gap-2 ${
              msgType === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}
          >
            <span>{msg}</span>
            <button
              onClick={() => setMsg('')}
              className="shrink-0 opacity-60 hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Blocked warning */}
        {isBlocked && blockedDeps.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-medium text-red-700 flex items-center gap-2">
              <Lock size={16} />
              Task terblokir
            </p>

            <p className="text-xs text-red-600 mt-1 mb-2">
              Selesaikan task berikut terlebih dahulu:
            </p>

            <ul className="space-y-1">
              {blockedDeps.map((d: any) => (
                <li
                  key={d.id}
                  className="text-sm text-red-700 flex items-center gap-2"
                >
                  <span className="w-1 h-1 rounded-full bg-red-500" />
                  {d.dependsOnTask?.title || 'Task tidak ditemukan'}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">

            {/* Task Details - compact layout */}
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 text-sm">

                {/* Status */}
                <div className="grid grid-cols-[120px_1fr] items-center gap-3">
                  <span className="text-slate-500 inline-flex items-center gap-1.5">
                    <CheckCircle2 size={15} />
                    Status
                  </span>

                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={task.status}
                      onChange={(e) =>
                        updateStatus.mutate({
                          status: e.target.value as Status,
                          version: task.version,
                        })
                      }
                      disabled={!isAssignee || isBlocked || updateStatus.isPending}
                      className="text-xs font-semibold rounded px-2 py-1.5 text-white border-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                      style={{ backgroundColor: activeStatus.color }}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                          style={{ color: '#000', background: '#fff' }}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>

                    {canStart && (
                      <button
                        onClick={() =>
                          updateStatus.mutate({
                            status: 'IN_PROGRESS',
                            version: task.version,
                          })
                        }
                        disabled={updateStatus.isPending}
                        className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                      >
                        Start
                      </button>
                    )}

                    {canFinish && (
                      <button
                        onClick={() =>
                          updateStatus.mutate({
                            status: 'DONE',
                            version: task.version,
                          })
                        }
                        disabled={updateStatus.isPending}
                        className="text-xs text-green-600 hover:underline disabled:opacity-50"
                      >
                        Mark Done
                      </button>
                    )}

                    {canRevert && (
                      <>
                        <button
                          onClick={() =>
                            updateStatus.mutate({
                              status: 'IN_PROGRESS',
                              version: task.version,
                            })
                          }
                          disabled={updateStatus.isPending}
                          className="text-xs text-amber-600 hover:underline disabled:opacity-50"
                        >
                          Reopen
                        </button>

                        <button
                          onClick={() =>
                            updateStatus.mutate({
                              status: 'TODO',
                              version: task.version,
                            })
                          }
                          disabled={updateStatus.isPending}
                          className="text-xs text-slate-500 hover:underline disabled:opacity-50"
                        >
                          Reset
                        </button>
                      </>
                    )}

                    {isBlocked && (
                      <span className="text-xs text-red-500 flex items-center gap-1">
                        <Lock size={12} />
                        Menunggu dependency
                      </span>
                    )}
                  </div>
                </div>

                {/* Assignees */}
                <div className="grid grid-cols-[120px_1fr] items-center gap-3">
                  <span className="text-slate-500 inline-flex items-center gap-1.5">
                    <Users size={15} />
                    Assignees
                  </span>

                  <div>
                    {canEdit ? (
                      <UserPicker
                        mode="project-members"
                        projectId={task.projectId}
                        value={form.assigneeId ? [form.assigneeId] : []}
                        onChange={(ids) =>
                          setForm({
                            ...form,
                            assigneeId: ids[0] || '',
                          })
                        }
                        multiple={false}
                        placeholder="Pilih assignee..."
                        allowDepartmentFilter
                      />
                    ) : task.assignee ? (
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="w-6 h-6 rounded-full text-white text-[10px] flex items-center justify-center font-semibold"
                          style={{
                            backgroundColor: colorFor(task.assignee.id),
                          }}
                        >
                          {initials(task.assignee.name)}
                        </span>
                        <span className="text-slate-700">
                          {task.assignee.name}
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-400">Empty</span>
                    )}
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-[120px_1fr] items-center gap-3">
                  <span className="text-slate-500 inline-flex items-center gap-1.5">
                    <Calendar size={15} />
                    Dates
                  </span>

                  <div>
                    {canEdit ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Input
                          type="date"
                          value={form.startDate}
                          onChange={(e) =>
                            handleStartDateChange(e.target.value)
                          }
                          className="w-[140px] h-8 text-xs"
                        />

                        <span className="text-slate-400">→</span>

                        <Input
                          type="date"
                          value={form.dueDate}
                          onChange={(e) =>
                            handleDueDateChange(e.target.value)
                          }
                          min={form.startDate || undefined}
                          className="w-[140px] h-8 text-xs"
                        />
                      </div>
                    ) : (
                      <span className="text-slate-700">
                        {task.startDate
                          ? task.startDate.slice(0, 10)
                          : '—'}
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
                          {task.dueDate
                            ? task.dueDate.slice(0, 10)
                            : '—'}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Priority */}
                <div className="grid grid-cols-[120px_1fr] items-center gap-3">
                  <span className="text-slate-500 inline-flex items-center gap-1.5">
                    <Flag size={15} />
                    Priority
                  </span>

                  <div>
                    {canEdit ? (
                      <select
                        value={form.priority}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            priority: e.target.value as Priority,
                          })
                        }
                        className="border rounded px-2 py-1.5 text-sm w-[140px] bg-white"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 border rounded-md text-xs ${
                          PRIORITY_COLOR[task.priority as Priority]
                        }`}
                      >
                        {task.priority}
                      </span>
                    )}
                  </div>
                </div>

                {/* Client Visible */}
                <div className="grid grid-cols-[120px_1fr] items-center gap-3">
                  <span className="text-slate-500 inline-flex items-center gap-1.5">
                    <Eye size={15} />
                    Client Visible
                  </span>

                  <div>
                    {canEdit ? (
                      <input
                        type="checkbox"
                        checked={form.isClientVisible}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            isClientVisible: e.target.checked,
                          })
                        }
                        className="w-4 h-4 accent-indigo-600"
                      />
                    ) : (
                      <span className="text-slate-700">
                        {task.isClientVisible ? 'Yes' : 'No'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-700">
                  Description
                </h2>
              </div>

              <div className="p-4">
                {canEdit ? (
                  <Textarea
                    rows={5}
                    value={form.description}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description: e.target.value,
                      })
                    }
                    placeholder="Tambahkan deskripsi..."
                    className="resize-none border-slate-200"
                  />
                ) : task.description ? (
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {task.description}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400 italic">
                    Tidak ada deskripsi.
                  </p>
                )}
              </div>
            </div>

            {/* Dependencies */}
            {canEdit && (
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <h2 className="text-sm font-semibold text-slate-700">
                    Dependencies
                  </h2>
                </div>

                <div className="p-4">
                  <p className="text-xs text-slate-500 mb-3">
                    Pilih task yang harus diselesaikan sebelum task ini dapat dimulai.
                  </p>

                  <div className="max-h-48 overflow-y-auto space-y-1 border border-slate-100 rounded-md p-2">
                    {(projectTasks.data || []).filter(
                      (t: any) => t.id !== task.id
                    ).length === 0 && (
                      <p className="text-xs text-slate-400 p-2">
                        Belum ada task lain.
                      </p>
                    )}

                    {(projectTasks.data || [])
                      .filter((t: any) => t.id !== task.id)
                      .map((t: any) => (
                        <label
                          key={t.id}
                          className="flex items-center gap-2 text-sm p-2 rounded hover:bg-slate-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={form.dependencyIds.includes(t.id)}
                            onChange={(e) => {
                              const set = new Set(form.dependencyIds);

                              if (e.target.checked) {
                                set.add(t.id);
                              } else {
                                set.delete(t.id);
                              }

                              setForm({
                                ...form,
                                dependencyIds: Array.from(set),
                              });
                            }}
                            className="accent-indigo-600"
                          />

                          <span className="truncate">{t.title}</span>

                          <span className="ml-auto text-[10px] text-slate-400 shrink-0">
                            {t.status}
                          </span>
                        </label>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Upload Attachments */}
            {canUpload && (
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <h2 className="text-sm font-semibold text-slate-700">
                    Upload Attachments
                  </h2>
                </div>

                <div className="p-4 space-y-3">
                  <Input
                    ref={fileRef}
                    type="file"
                    multiple
                  />

                  <div className="flex items-center gap-3 flex-wrap">
                    <Button
                      onClick={() => {
                        const files = Array.from(
                          fileRef.current?.files || []
                        );

                        if (files.length) {
                          upload.mutate(files);
                        }
                      }}
                      disabled={upload.isPending}
                    >
                      <Upload size={14} className="mr-1" />
                      {upload.isPending ? 'Uploading...' : 'Upload Files'}
                    </Button>

                    <p className="text-xs text-slate-500">
                      Maksimal 20 file per upload.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Attachments */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-700">
                  Attachments ({attachments?.length || 0})
                </h2>
              </div>

              <div className="p-4 space-y-5">
                {attachments?.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-400">
                      Belum ada lampiran.
                    </p>
                  </div>
                )}

                {/* Previewable files */}
                {previewable.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wide">
                      Preview
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {previewable.map((a: any) => (
                        <div key={a.id} className="group/card">
                          <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 aspect-square">

                            {isImage(a.mimeType) ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={previewUrl(a.id)}
                                alt={a.originalName}
                                className="w-full h-full object-cover cursor-zoom-in"
                                loading="lazy"
                                onClick={() => setPreview(a)}
                              />
                            ) : (
                              <div
                                className="w-full h-full cursor-zoom-in flex items-center justify-center"
                                onClick={() => setPreview(a)}
                              >
                                <iframe
                                  src={previewUrl(a.id)}
                                  className="w-full h-full pointer-events-none"
                                  title={a.originalName}
                                />
                              </div>
                            )}

                            {/* Hover actions */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/card:opacity-100 transition flex items-center justify-center gap-1">
                              <button
                                onClick={() => setPreview(a)}
                                className="p-1.5 bg-white rounded-md hover:bg-slate-100"
                                title="Preview"
                              >
                                <Eye size={14} />
                              </button>

                              <button
                                onClick={() => download(a)}
                                className="p-1.5 bg-white rounded-md hover:bg-slate-100"
                                title="Download"
                              >
                                <Download size={14} />
                              </button>

                              {canDeleteAttachment(a) && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Hapus ${a.originalName}?`)) {
                                      removeAttachment.mutate(a.id);
                                    }
                                  }}
                                  className="p-1.5 bg-white rounded-md hover:bg-red-50 text-red-600"
                                  title="Hapus"
                                  disabled={removeAttachment.isPending}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>

                          <p
                            className="text-xs text-slate-600 mt-1 truncate"
                            title={a.originalName}
                          >
                            {a.originalName}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other files */}
                {others.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wide">
                      Files
                    </p>

                    <div className="space-y-2">
                      {others.map((a: any) => (
                        <div
                          key={a.id}
                          className="flex items-center justify-between gap-3 border border-slate-200 rounded-lg p-3 hover:border-slate-300 transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                              <FileTypeIcon
                                mimeType={a.mimeType}
                                size={20}
                              />
                            </div>

                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {a.originalName}
                              </p>

                              <p className="text-xs text-slate-400">
                                {mimeLabel(a.mimeType)} ·{' '}
                                {(a.size / 1024).toFixed(1)} KB ·{' '}
                                {a.uploadedBy?.name || 'Unknown'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => download(a)}
                              title="Download"
                            >
                              <Download size={14} />
                            </Button>

                            {canDeleteAttachment(a) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (confirm(`Hapus ${a.originalName}?`)) {
                                    removeAttachment.mutate(a.id);
                                  }
                                }}
                                disabled={removeAttachment.isPending}
                                title="Hapus"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 size={14} />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ACTIVITY LOG ONLY */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700">
                  Activity Log
                </h2>
                <span className="text-xs text-slate-400">
                  {logs?.length || 0} activities
                </span>
              </div>

              <div className="p-4">
                {!logs?.length ? (
                  <p className="text-sm text-slate-400 text-center py-6">
                    Belum ada aktivitas.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {logs.map((l: any) => (
                      <div
                        key={l.id}
                        className="relative border-l-2 border-indigo-200 pl-4 pb-1"
                      >
                        <span className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-indigo-500" />

                        <p className="text-sm font-medium text-slate-700">
                          {l.actor?.name || 'Unknown'}
                        </p>

                        <p className="text-xs text-slate-500 mt-0.5">
                          Mengubah{' '}
                          <span className="font-mono text-indigo-600 bg-indigo-50 px-1 rounded">
                            {l.changedColumn}
                          </span>
                        </p>

                        <div className="mt-2 bg-slate-50 rounded-md p-2 space-y-1">
                          <p className="text-xs text-slate-400 break-words">
                            <span className="font-medium">Dari:</span>{' '}
                            {l.oldValue || '(kosong)'}
                          </p>

                          <p className="text-xs text-slate-600 break-words">
                            <span className="font-medium">Menjadi:</span>{' '}
                            {l.newValue || '(kosong)'}
                          </p>
                        </div>

                        <p className="text-[11px] text-slate-400 mt-2">
                          {formatDateTime(l.timestamp)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {preview && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b gap-3">
              <p className="text-sm font-medium truncate">
                {preview.originalName}
              </p>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => download(preview)}
                >
                  <Download size={14} className="mr-1" />
                  Download
                </Button>

                <button
                  onClick={() => setPreview(null)}
                  className="p-1.5 hover:bg-slate-100 rounded"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 flex items-center justify-center min-h-[200px]">
              {isImage(preview.mimeType) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl(preview.id)}
                  alt={preview.originalName}
                  className="max-w-full max-h-[75vh] object-contain"
                />
              ) : isPdf(preview.mimeType) ? (
                <iframe
                  src={previewUrl(preview.id)}
                  className="w-[80vw] h-[75vh] rounded"
                  title={preview.originalName}
                />
              ) : (
                <div className="text-center py-10">
                  <p className="text-sm text-slate-600 mb-3">
                    Preview tidak tersedia.
                  </p>

                  <Button onClick={() => download(preview)}>
                    <Download size={14} className="mr-1" />
                    Download File
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}