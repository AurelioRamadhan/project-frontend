'use client';

import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserPicker } from '@/components/ui/user-picker';

export interface TaskFormValue {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assigneeId: string;
  startDate: string;
  dueDate: string;
  isClientVisible: boolean;
  dependencyIds: string[];
}

const empty: TaskFormValue = {
  title: '',
  description: '',
  priority: 'MEDIUM',
  assigneeId: '',
  startDate: '',
  dueDate: '',
  isClientVisible: false,
  dependencyIds: [],
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
  taskId?: string;
  allTasks: any[];
  initial?: Partial<TaskFormValue>;
  version?: number;
}

export function TaskDialog({
  open,
  onOpenChange,
  projectId,
  taskId,
  allTasks,
  initial,
  version,
}: Props) {
  const qc = useQueryClient();
  const isEdit = !!taskId;
  const [form, setForm] = useState<TaskFormValue>({ ...empty, ...initial });
  const [assigneeIds, setAssigneeIds] = useState<string[]>(
    initial?.assigneeId ? [initial.assigneeId] : []
  );

  useEffect(() => {
    if (!open) return;
    setForm({ ...empty, ...initial });
    setAssigneeIds(initial?.assigneeId ? [initial.assigneeId] : []);
  }, [open, initial]);

  const dependencyCandidates = useMemo(
    () => allTasks.filter((t: any) => t.id !== taskId),
    [allTasks, taskId]
  );

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title: form.title,
        description: form.description || null,
        priority: form.priority,
        isClientVisible: form.isClientVisible,
        assigneeId: assigneeIds[0] || null,
        dependencyIds: form.dependencyIds,
      };
      if (form.startDate) payload.startDate = new Date(form.startDate).toISOString();
      else if (isEdit) payload.startDate = null;
      if (form.dueDate) payload.dueDate = new Date(form.dueDate).toISOString();
      else if (isEdit) payload.dueDate = null;
      if (isEdit && version !== undefined) payload.version = version;

      return isEdit
        ? api.put(`/api/tasks/${taskId}`, payload)
        : api.post(`/api/tasks/project/${projectId}`, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] });
      qc.invalidateQueries({ queryKey: ['task', taskId] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      onOpenChange(false);
    },
    onError: (e: any) =>
      alert(e.response?.data?.error || (isEdit ? 'Gagal update task' : 'Gagal membuat task')),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Task' : 'Create New Task'}</DialogTitle>
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
          <div>
            <Label>Priority</Label>
            <select
              className="w-full border rounded-md p-2"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div>
            <Label>Assignee (Project Member)</Label>
            <UserPicker
              mode="project-members"
              projectId={projectId}
              value={assigneeIds}
              onChange={setAssigneeIds}
              multiple={false}
              placeholder="Pilih assignee..."
              allowDepartmentFilter
            />
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
            <Label>Dependencies</Label>
            <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-1">
              {dependencyCandidates.length === 0 && (
                <p className="text-xs text-slate-400">Belum ada task lain.</p>
              )}
              {dependencyCandidates.map((t: any) => (
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
              onChange={(e) => setForm({ ...form, isClientVisible: e.target.checked })}
            />
            Client Visibility
          </label>
          <Button
            className="w-full"
            disabled={!form.title || save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Task'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}