'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Lock, Pencil, Trash2 } from 'lucide-react';
import { colorFor, initials, formatDate } from '@/lib/format';

interface TaskCardProps {
  task: any;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  showDependencyHint?: boolean;
  canEdit?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function TaskCard({
  task,
  draggable,
  onDragStart,
  onDragEnd,
  showDependencyHint,
  canEdit,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const [dragging, setDragging] = useState(false);
  const assignee = task.assignee;
  const blockedDeps = (task.dependencies || []).filter(
    (d: any) => d.dependsOnTask?.status !== 'DONE'
  );

  const handleDragStart = (e: React.DragEvent) => {
    if (!draggable) {
      e.preventDefault();
      return;
    }
    setDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.();
  };

  const handleDragEnd = () => {
    setDragging(false);
    onDragEnd?.();
  };

  const baseClass =
    'bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 transition-all duration-200 ease-out group relative';

  const dragClass = draggable
    ? 'cursor-grab active:cursor-grabbing hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5'
    : 'cursor-default';

  const draggingClass = dragging
    ? 'opacity-50 shadow-2xl scale-[1.02] rotate-1 border-indigo-300'
    : '';

  return (
    <div
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`${baseClass} ${dragClass} ${draggingClass}`}
    >
      {(canEdit || onDelete) && (
        <div
          className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {canEdit && onEdit && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit();
              }}
              className="p-1 bg-white border rounded text-slate-500 hover:text-blue-600 hover:border-blue-300"
              title="Edit"
            >
              <Pencil size={12} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 bg-white border rounded text-slate-500 hover:text-red-600 hover:border-red-300"
              title="Hapus"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      )}

      <Link href={`/tasks/${task.id}`} className="pr-14">
        <h3 className="text-[15px] text-slate-800 leading-snug line-clamp-2 hover:text-indigo-600">
          {task.title}
        </h3>
      </Link>

      <div className="flex items-center gap-3 text-slate-500">
        <span className="inline-flex items-center gap-1 text-xs">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="17" y2="12" />
            <line x1="3" y1="18" x2="11" y2="18" />
          </svg>
        </span>
        <span className="inline-flex items-center gap-1 text-xs">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
          {task.attachments?.length || 0}
        </span>
      </div>

      {(assignee || task.dueDate) && (
        <div className="flex items-center gap-2 flex-wrap">
          {assignee && (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-semibold border-2 border-white shadow-sm"
              style={{ backgroundColor: colorFor(assignee.id) }}
              title={assignee.name}
            >
              {initials(assignee.name)}
            </div>
          )}
          {task.dueDate && (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-md text-xs ${
                task.status !== 'DONE' && new Date(task.dueDate) < new Date()
                  ? 'border-red-200 text-red-600 bg-red-50'
                  : 'border-slate-200 text-slate-600 bg-white'
              }`}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {formatDate(task.dueDate)}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="text-[10px] uppercase">
          {task.department}
        </Badge>
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 border rounded-md text-xs ${
            task.priority === 'HIGH'
              ? 'border-red-200 text-red-600 bg-red-50'
              : task.priority === 'MEDIUM'
              ? 'border-amber-200 text-amber-700 bg-amber-50'
              : 'border-slate-200 text-slate-600 bg-white'
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 21V4h9l.4 2H20v10h-7l-.4-2H6v7H4z" />
          </svg>
          {task.priority}
        </span>
      </div>

      {showDependencyHint && blockedDeps.length > 0 && (
        <div className="flex items-start gap-1.5 text-[11px] text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1.5">
          <Lock size={12} className="mt-0.5 shrink-0" />
          <span>
            Selesaikan dulu:{' '}
            {blockedDeps
              .map((d: any) => d.dependsOnTask?.title)
              .filter(Boolean)
              .join(', ')}
          </span>
        </div>
      )}
    </div>
  );
}