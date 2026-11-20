'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserPicker } from '@/components/ui/user-picker';

export interface ProjectFormValue {
  name: string;
  description: string;
  startDate: string;
  dueDate: string;
  clientId: string;
  memberIds: string[];
}

const empty: ProjectFormValue = {
  name: '',
  description: '',
  startDate: '',
  dueDate: '',
  clientId: '',
  memberIds: [],
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
  projectId?: string;
  initial?: Partial<ProjectFormValue>;
}

export function ProjectDialog({ open, onOpenChange, projectId, initial, onSaved }: Props) {
  const qc = useQueryClient();
  const isEdit = !!projectId;

  const [form, setForm] = useState<ProjectFormValue>({ ...empty, ...initial });
  const [clientIds, setClientIds] = useState<string[]>(
    initial?.clientId ? [initial.clientId] : []
  );

  useEffect(() => {
    if (!open) return;
    setForm({ ...empty, ...initial });
    setClientIds(initial?.clientId ? [initial.clientId] : []);
  }, [open, initial]);

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name: form.name,
        description: form.description || undefined,
      };
      if (form.startDate) payload.startDate = `${form.startDate}T00:00:00.000Z`;
      if (form.dueDate) payload.dueDate = `${form.dueDate}T00:00:00.000Z`;
      if (clientIds[0]) payload.clientId = clientIds[0];
      payload.memberIds = form.memberIds;
      return isEdit
        ? api.put(`/api/projects/${projectId}`, payload)
        : api.post('/api/projects', payload);
    },
    onSuccess: () => {
      onSaved?.();
      save.reset();
      qc.invalidateQueries({ queryKey: ['projects'] });
      onOpenChange(false);
    },
    onError: () => undefined,
  });

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (nextOpen) save.reset();
      onOpenChange(nextOpen);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Project' : 'Create New Project'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {save.isError && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3" role="alert">{getApiErrorMessage(save.error, isEdit ? 'Gagal update project.' : 'Gagal membuat project.')}</p>}
          <div>
            <Label>Project Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
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
            <Label>Client</Label>
            <UserPicker
              mode="all-users"
              role="CLIENT"
              value={clientIds}
              onChange={setClientIds}
              multiple={false}
              placeholder="Pilih client..."
            />
          </div>
          <div>
            <Label>Project Members</Label>
            <UserPicker
              mode="all-users"
              role="INTERNAL"
              value={form.memberIds}
              onChange={(ids) => setForm({ ...form, memberIds: ids })}
              placeholder="Pilih member..."
              allowDepartmentFilter
            />
          </div>
          <Button
            className="w-full"
            disabled={!form.name || save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Project'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}