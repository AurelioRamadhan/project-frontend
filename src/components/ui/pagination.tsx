'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, onChange }: Props) {
  const safeTotalPages = Math.max(1, totalPages);

  const pages: (number | '...')[] = [];
  if (safeTotalPages <= 7) {
    for (let i = 1; i <= safeTotalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    const start = Math.max(2, page - 1);
    const end = Math.min(safeTotalPages - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (page < safeTotalPages - 2) pages.push('...');
    pages.push(safeTotalPages);
  }

  return (
    <div className="flex items-center justify-between mt-6 flex-wrap gap-3">
      <p className="text-sm text-slate-500">
        Total: {total} · Halaman {page} dari {safeTotalPages}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={14} />
        </Button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`e-${i}`} className="px-2 text-slate-400 text-sm">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`min-w-[32px] h-8 rounded-md text-sm ${
                p === page
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border text-slate-700 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          )
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={page >= safeTotalPages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}