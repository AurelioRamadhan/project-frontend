'use client';
import { Sidebar } from './sidebar';
import { RouteGuard } from '@/components/route-guard';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </RouteGuard>
  );
}