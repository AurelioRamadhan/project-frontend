'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Search, X } from 'lucide-react';
import { colorFor, initials } from '@/lib/format';

export interface PickerUser {
  id: string;
  name: string;
  email: string;
  role?: string;
  department?: string;
}

interface Props {
  mode: 'project-members' | 'all-users';
  projectId?: string;
  role?: 'INTERNAL' | 'CLIENT';
  value: string[];
  onChange: (ids: string[]) => void;
  multiple?: boolean;
  placeholder?: string;
  allowDepartmentFilter?: boolean;
}

const DEPARTMENTS = ['ALL', 'UIUX', 'FRONTEND', 'BACKEND'];

export function UserPicker({
  mode,
  projectId,
  role,
  value,
  onChange,
  multiple = true,
  placeholder,
  allowDepartmentFilter = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('ALL');
  const [assignees, setAssignees] = useState<PickerUser[]>([]);
  const [people, setPeople] = useState<PickerUser[]>([]);
  const [userCache, setUserCache] = useState<Record<string, PickerUser>>({});
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!value.length) return;
    const missing = value.filter((id) => !userCache[id]);
    if (!missing.length) return;
    api
      .get(`/api/users/by-ids?ids=${missing.join(',')}`)
      .then((r) => {
        const next: Record<string, PickerUser> = {};
        (r.data || []).forEach((u: PickerUser) => (next[u.id] = u));
        setUserCache((prev) => ({ ...prev, ...next }));
      })
      .catch(() => {});
  }, [value, userCache]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (value.length) params.set('selected', value.join(','));

    let url: string;
    if (mode === 'project-members' && projectId) {
      if (allowDepartmentFilter && department !== 'ALL') {
        params.set('department', department);
      }
      url = `/api/users/project-members/${projectId}?${params.toString()}`;
    } else {
      const roleParam = role || 'INTERNAL';
      params.set('role', roleParam);
      if (allowDepartmentFilter && department !== 'ALL') {
        params.set('department', department);
      }
      url = `/api/users/search?${params.toString()}`;
    }

    api
      .get(url)
      .then((r) => {
        if (cancelled) return;
        const list: PickerUser[] = r.data.all || [
          ...(r.data.assignees || []),
          ...(r.data.people || []),
        ];
        const nextCache: Record<string, PickerUser> = {};
        list.forEach((u) => (nextCache[u.id] = u));
        setUserCache((prev) => ({ ...prev, ...nextCache }));
        setAssignees(r.data.assignees || []);
        setPeople(r.data.people || []);
      })
      .catch(() => {
        if (!cancelled) {
          setAssignees([]);
          setPeople([]);
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, search, value, role, mode, projectId, department, allowDepartmentFilter]);

  const toggle = (id: string) => {
    if (multiple) {
      onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
    } else {
      onChange(value.includes(id) ? [] : [id]);
      setOpen(false);
    }
  };

  const displayName = (id: string) => userCache[id]?.name || id.slice(0, 6) + '...';

  return (
    <div className="relative" ref={wrapRef}>
      <div
        className="min-h-[38px] border rounded-md p-1.5 flex flex-wrap gap-1 cursor-pointer bg-white"
        onClick={() => setOpen((v) => !v)}
      >
        {value.length === 0 && (
          <span className="text-sm text-slate-400 px-1 py-1">
            {placeholder || 'Pilih user...'}
          </span>
        )}
        {value.map((id) => (
          <span
            key={id}
            className="inline-flex items-center gap-1 bg-slate-100 rounded-full pl-1 pr-2 py-0.5 text-xs"
          >
            <span
              className="w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-semibold"
              style={{ backgroundColor: colorFor(id) }}
            >
              {initials(displayName(id))}
            </span>
            <span className="max-w-[120px] truncate">{displayName(id)}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChange(value.filter((v) => v !== id));
              }}
              className="text-slate-400 hover:text-slate-700"
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>

      {open && (
        <div className="absolute z-30 mt-1 w-full max-w-sm bg-white border rounded-lg shadow-xl">
          <div className="p-2 border-b space-y-2">
            <div className="flex items-center gap-2 border rounded-md px-2 py-1.5">
              <Search size={14} className="text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau email..."
                className="flex-1 text-sm outline-none"
                autoFocus
              />
            </div>
            {allowDepartmentFilter && (
              <div className="flex gap-1 flex-wrap">
                {DEPARTMENTS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDepartment(d)}
                    className={`text-[11px] px-2 py-1 rounded ${
                      department === d
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto p-1">
            {loading && <p className="text-xs text-slate-400 p-3">Memuat...</p>}
            {!loading && assignees.length === 0 && people.length === 0 && (
              <p className="text-xs text-slate-400 p-3">Tidak ada hasil</p>
            )}
            {assignees.length > 0 && (
              <>
                <p className="text-xs font-medium text-slate-500 px-2 py-1">Assignees</p>
                {assignees.map((u) => (
                  <PickerRow key={u.id} user={u} selected onToggle={() => toggle(u.id)} />
                ))}
              </>
            )}
            {people.length > 0 && (
              <>
                <p className="text-xs font-medium text-slate-500 px-2 py-1 mt-1">People</p>
                {people.map((u) => (
                  <PickerRow key={u.id} user={u} selected={false} onToggle={() => toggle(u.id)} />
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PickerRow({
  user,
  selected,
  onToggle,
}: {
  user: PickerUser;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-100 text-left"
    >
      <div
        className={`relative w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${
          selected ? 'ring-2 ring-indigo-500 ring-offset-1' : ''
        }`}
        style={{ backgroundColor: colorFor(user.id) }}
      >
        {initials(user.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{user.name}</p>
        {user.email && <p className="text-[11px] text-slate-400 truncate">{user.email}</p>}
      </div>
      {user.department && (
        <span className="text-[10px] text-slate-400 uppercase">{user.department}</span>
      )}
    </button>
  );
}