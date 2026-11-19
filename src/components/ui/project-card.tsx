'use client';

import Link from 'next/link';
import { Pencil, Trash2, Calendar } from 'lucide-react';
import { colorFor, initials, formatDate } from '@/lib/format';

interface Props {
  project: any;
  canEdit?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ProjectCard({ project, canEdit, onEdit, onDelete }: Props) {
  const members = project.members || [];
  const stats = project.stats || { totalTasks: 0, doneTasks: 0, progress: 0 };

  return (
    <div className="relative bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-3 hover:shadow-md hover:border-slate-300 transition group">
      {canEdit && (
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onEdit?.();
            }}
            className="p-1.5 bg-white border rounded-md text-slate-500 hover:text-blue-600 hover:border-blue-300"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete?.();
            }}
            className="p-1.5 bg-white border rounded-md text-slate-500 hover:text-red-600 hover:border-red-300"
            title="Hapus"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      <Link href={`/projects/${project.id}`} className="flex flex-col gap-2">
        <h3 className="text-base font-medium text-slate-800 pr-16 hover:text-indigo-600 line-clamp-1">
          {project.name}
        </h3>
        <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px]">
          {project.description || 'Tidak ada deskripsi'}
        </p>
      </Link>

      {(project.startDate || project.dueDate) && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Calendar size={13} />
          <span>
            {project.startDate ? formatDate(project.startDate) : '—'}
            {' → '}
            <span
              className={
                project.dueDate &&
                new Date(project.dueDate) < new Date() &&
                stats.progress < 100
                  ? 'text-red-600'
                  : ''
              }
            >
              {project.dueDate ? formatDate(project.dueDate) : '—'}
            </span>
          </span>
        </div>
      )}

      <div>
        <div className="flex justify-between text-[11px] text-slate-500 mb-1">
          <span>Progress</span>
          <span className="font-semibold text-slate-700">{stats.progress}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all"
            style={{ width: `${stats.progress}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          {stats.doneTasks}/{stats.totalTasks} task selesai
        </p>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
        {project.client && (
          <span className="inline-flex items-center gap-1 truncate">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-semibold shrink-0"
              style={{ backgroundColor: colorFor(project.client.id) }}
            >
              {initials(project.client.name)}
            </span>
            <span className="truncate max-w-[100px]">{project.client.name}</span>
          </span>
        )}
        <div className="flex items-center ml-auto">
          {members.slice(0, 3).map((m: any) => {
            const u = m.user || m;
            return (
              <div
                key={u.id}
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-semibold border-2 border-white -ml-1.5 first:ml-0"
                style={{ backgroundColor: colorFor(u.id) }}
                title={u.name}
              >
                {initials(u.name)}
              </div>
            );
          })}
          {members.length > 3 && (
            <span className="ml-1 text-[10px] text-slate-400">+{members.length - 3}</span>
          )}
        </div>
      </div>
    </div>
  );
}