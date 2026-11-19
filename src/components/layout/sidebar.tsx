'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FolderKanban,
  Kanban,
  Users,
  Activity,
  ListTodo,
} from 'lucide-react';

const menus = {
  PM: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Projects', href: '/projects', icon: FolderKanban },
    { label: 'Task Board', href: '/board', icon: Kanban },
    { label: 'Team Members', href: '/team', icon: Users },
    { label: 'Activity Logs', href: '/activity', icon: Activity },
  ],
  INTERNAL: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'My Tasks', href: '/tasks', icon: ListTodo },
    { label: 'My Projects', href: '/projects', icon: FolderKanban },
  ],
  CLIENT: [{ label: 'Client Dashboard', href: '/client', icon: LayoutDashboard }],
};

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  if (!user) return null;
  const items = menus[user.role] ?? [];

  return (
    <aside className="w-64 min-h-screen bg-blue-900 text-white flex flex-col">
      <div className="p-6 border-b border-blue-800">
        <h1 className="text-xl font-bold">ProjectFlow</h1>
        <p className="text-xs text-blue-300 mt-1">
          {user.role} · {user.department}
        </p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition',
                active ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-800'
              )}
            >
              <Icon size={18} /> {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}