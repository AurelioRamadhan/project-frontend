'use client';

import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { RouteGuard } from '@/components/route-guard';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <main className="flex-1 p-8 overflow-auto">{children}</main>
        </div>
      </div>
    </RouteGuard>
  );
}