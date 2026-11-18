'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function TaskDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');

  const { data: attachments } = useQuery({
    queryKey: ['attachments', id],
    queryFn: async () => (await api.get(`/api/attachments/task/${id}`)).data,
  });

  const { data: logs } = useQuery({
    queryKey: ['audit', id],
    queryFn: async () => (await api.get(`/api/audit/task/${id}`)).data,
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      return api.post(`/api/attachments/task/${id}`, fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attachments', id] });
      setMsg('File berhasil diupload');
    },
    onError: (e: any) => setMsg(e.response?.data?.error || 'Gagal upload'),
  });

  const download = async (attId: string, name: string) => {
    const res = await api.get(`/api/attachments/${attId}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <div className="max-w-4xl space-y-6">
        <h1 className="text-3xl font-bold">Task Detail</h1>

        <Card>
          <CardHeader><CardTitle>Work Attachments</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input ref={fileRef} type="file" />
            <Button
              onClick={() => fileRef.current?.files?.[0] && upload.mutate(fileRef.current.files[0])}
              disabled={upload.isPending}
            >
              {upload.isPending ? 'Uploading...' : 'Upload'}
            </Button>
            {msg && <p className="text-sm text-slate-600">{msg}</p>}
            <div className="space-y-2">
              {attachments?.map((a: any) => (
                <div key={a.id} className="flex justify-between items-center border p-2 rounded">
                  <span className="text-sm">{a.originalName}</span>
                  <Button size="sm" variant="outline" onClick={() => download(a.id, a.originalName)}>Download</Button>
                </div>
              ))}
              {attachments?.length === 0 && <p className="text-slate-400 text-sm">Belum ada lampiran.</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Activity Log</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {logs?.map((l: any) => (
                <div key={l.id} className="text-sm border-l-2 border-blue-500 pl-3">
                  <p className="font-medium">{l.actor.name} mengubah <span className="font-mono">{l.changedColumn}</span></p>
                  <p className="text-slate-500 text-xs">
                    {l.oldValue || '(kosong)'} → {l.newValue || '(kosong)'}
                  </p>
                  <p className="text-slate-400 text-xs">{new Date(l.timestamp).toLocaleString('id-ID')}</p>
                </div>
              ))}
              {logs?.length === 0 && <p className="text-slate-400 text-sm">Belum ada aktivitas.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}