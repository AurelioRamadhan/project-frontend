'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { colorFor, initials } from '@/lib/format';
import { Search } from 'lucide-react';

const PAGE_SIZE = 12;

export default function TeamPage() {
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('ALL');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['team-members', search, department, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('role', 'INTERNAL');
      params.set('q', search || '');
      if (department !== 'ALL') params.set('department', department);
      const r = await api.get(`/api/users/search?${params.toString()}`);
      const all: any[] = r.data.all || [];
      const total = all.length;
      const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      const start = (page - 1) * PAGE_SIZE;
      return {
        data: all.slice(start, start + PAGE_SIZE),
        meta: { page, total, totalPages },
      };
    },
  });

  const members = data?.data || [];
  const meta = data?.meta;

  return (
    <AppShell>
      <div className="max-w-4xl">
        <div className="flex justify-between items-center mb-4 gap-3 flex-wrap">
          <h1 className="text-3xl font-bold">Team Members</h1>
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
              placeholder="Cari nama atau email..."
              className="flex-1 text-sm outline-none"
            />
          </div>
          <select
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setPage(1);
            }}
            className="border rounded-md px-3 py-2 text-sm bg-white"
          >
            <option value="ALL">All Department</option>
            <option value="PRODUCT">Product</option>
            <option value="UIUX">UI/UX</option>
            <option value="FRONTEND">Frontend</option>
            <option value="BACKEND">Backend</option>
          </select>
        </div>

        {isLoading && <p className="text-slate-400">Memuat...</p>}
        {!isLoading && members.length === 0 && (
          <p className="text-slate-400">Tidak ada member.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members.map((u: any) => (
            <Card key={u.id}>
              <CardContent className="p-4 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                  style={{ backgroundColor: colorFor(u.id) }}
                >
                  {initials(u.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{u.name}</p>
                  <p className="text-sm text-slate-500 truncate">{u.email}</p>
                </div>
                {u.department && (
                  <Badge variant="outline" className="text-xs">
                    {u.department}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
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