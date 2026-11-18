'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

export default function ProjectsPage() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    startDate: '',
    dueDate: '',
    clientId: '',
    memberIds: [] as string[],
  });

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await api.get('/api/projects')).data,
  });

  // Ambil daftar client & internal team (khusus PM)
  const { data: clients } = useQuery({
    queryKey: ['users-clients'],
    queryFn: async () => (await api.get('/api/users/clients')).data,
    enabled: user?.role === 'PM',
  });

  const { data: internals } = useQuery({
    queryKey: ['users-internal'],
    queryFn: async () => (await api.get('/api/users/internal')).data,
    enabled: user?.role === 'PM',
  });

  const resetForm = () =>
    setForm({ name: '', description: '', startDate: '', dueDate: '', clientId: '', memberIds: [] });

  const create = useMutation({
    mutationFn: async () => {
      const payload: any = { name: form.name };
      if (form.description) payload.description = form.description;
      if (form.startDate) payload.startDate = new Date(form.startDate).toISOString();
      if (form.dueDate) payload.dueDate = new Date(form.dueDate).toISOString();
      if (form.clientId) payload.clientId = form.clientId;
      if (form.memberIds.length) payload.memberIds = form.memberIds;
      return api.post('/api/projects', payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      setOpen(false);
      resetForm();
    },
    onError: (e: any) => alert(e.response?.data?.error || 'Gagal membuat project'),
  });

  return (
    <AppShell>
      <div className="max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{user?.role === 'PM' ? 'Projects' : 'My Projects'}</h1>
          {user?.role === 'PM' && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button>+ Create Project</Button></DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Create New Project</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Project Name *</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Description *</Label>
                    <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Start Date</Label>
                      <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                    </div>
                    <div>
                      <Label>Due Date</Label>
                      <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label>Client *</Label>
                    <select
                      className="w-full border rounded-md p-2"
                      value={form.clientId}
                      onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                    >
                      <option value="">— Pilih Client —</option>
                      {clients?.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                      ))}
                    </select>
                    {clients?.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">Belum ada user dengan role CLIENT. Register dulu.</p>
                    )}
                  </div>
                  <div>
                    <Label>Project Members (Internal Team) *</Label>
                    <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                      {internals?.length === 0 && (
                        <p className="text-xs text-slate-400">Belum ada user INTERNAL. Register dulu.</p>
                      )}
                      {internals?.map((u: any) => (
                        <label key={u.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={form.memberIds.includes(u.id)}
                            onChange={(e) => {
                              const set = new Set(form.memberIds);
                              e.target.checked ? set.add(u.id) : set.delete(u.id);
                              setForm({ ...form, memberIds: Array.from(set) });
                            }}
                          />
                          {u.name} — <span className="text-slate-500">{u.department}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    disabled={!form.name || !form.clientId || form.memberIds.length === 0 || create.isPending}
                    onClick={() => create.mutate()}
                  >
                    {create.isPending ? 'Menyimpan...' : 'Simpan Project'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading && <p className="text-slate-400">Memuat...</p>}
        {projects?.length === 0 && <p className="text-slate-400">Belum ada project.</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects?.map((p: any) => (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card className="hover:shadow-md transition cursor-pointer h-full">
                <CardHeader><CardTitle className="text-lg">{p.name}</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500 line-clamp-2">{p.description || 'Tidak ada deskripsi'}</p>
                  {p.client && <p className="text-xs text-slate-400 mt-2">Client: {p.client.name}</p>}
                  {p.members && (
                    <p className="text-xs text-slate-400 mt-1">
                      {p.members.length} member{p.members.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}