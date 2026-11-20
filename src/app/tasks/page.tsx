'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { AppShell } from '@/components/layout/app-shell';
import { TaskCard } from '@/components/ui/task-card';
import { Pagination } from '@/components/ui/pagination';
import { Search } from 'lucide-react';

export default function MyTasksPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterDepartment, setFilterDepartment] = useState('ALL');
  const [sort, setSort] = useState('createdAt:desc');
  const [page, setPage] = useState(1);
  const rows = 12;

  const { data, isLoading, error } = useQuery({
    queryKey: ['my-tasks', page, search, filterStatus, filterPriority, filterDepartment, sort],
    queryFn: async () => {
      const [orderKey, orderRule] = sort.split(':');
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('rows', String(rows));
      params.set('orderKey', orderKey);
      params.set('orderRule', orderRule);
      if (search) params.set('searchFilters', JSON.stringify({ title: search }));
      const filters: any = {};
      if (filterStatus !== 'ALL') filters.status = filterStatus;
      if (filterPriority !== 'ALL') filters.priority = filterPriority;
      if (filterDepartment !== 'ALL') filters.department = filterDepartment;
      if (Object.keys(filters).length) params.set('filters', JSON.stringify(filters));
      return (await api.get(`/api/tasks?${params.toString()}`)).data;
    },
  });

  const tasks = data?.data || [];
  const meta = data?.meta;

  return (
    <AppShell>
      <div className="max-w-6xl">
        <h1 className="text-3xl font-bold mb-4">My Tasks</h1>

        <div className="flex gap-2 mb-4 flex-wrap">
          <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-white flex-1 min-w-[200px]">
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari task..."
              className="flex-1 text-sm outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="border rounded-md px-3 py-2 text-sm bg-white"
          >
            <option value="ALL">All Status</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
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
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm bg-white"
          >
            <option value="createdAt:desc">Newest</option>
            <option value="createdAt:asc">Oldest</option>
            <option value="dueDate:asc">Due Date ↑</option>
            <option value="dueDate:desc">Due Date ↓</option>
          </select>
        </div>

        {isLoading && <p className="text-slate-400" role="status">Memuat task...</p>}
        {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3" role="alert">{getApiErrorMessage(error, 'Gagal memuat task.')}</p>}
        {!isLoading && !error && tasks.length === 0 && (
          <p className="text-slate-400">Tidak ada task.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {!isLoading && !error && tasks.map((t: any) => (
            <TaskCard key={t.id} task={t} showDependencyHint />
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