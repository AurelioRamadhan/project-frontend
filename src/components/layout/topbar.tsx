'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { colorFor, initials } from '@/lib/format';
import { LogOut, User as UserIcon } from 'lucide-react';

export function Topbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="text-sm text-slate-500">ProjectFlow</div>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 hover:bg-slate-100 rounded-full px-2 py-1"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
            style={{ backgroundColor: colorFor(user.id) }}
          >
            {initials(user.name)}
          </div>
          <span className="text-sm font-medium hidden md:inline">{user.name}</span>
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg overflow-hidden">
            <div className="p-3 border-b">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
              <p className="text-[11px] text-slate-400 mt-1">
                {user.role} · {user.department}
              </p>
            </div>
            <button
              onClick={() => {
                setOpen(false);
                router.push('/profile');
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"
            >
              <UserIcon size={14} /> Profile
            </button>
            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 text-red-600 flex items-center gap-2"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}