export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatAuditValue(column: string, value: string | null | undefined): string {
  if (!value) return '(kosong)';
  const labels: Record<string, string> = {
    title: 'Judul task', description: 'Deskripsi', status: 'Status', priority: 'Prioritas',
    department: 'Departemen', assigneeId: 'Penanggung jawab', isClientVisible: 'Terlihat oleh client',
    startDate: 'Tanggal mulai', dueDate: 'Tenggat waktu', dependencies: 'Task prasyarat',
    attachment: 'Lampiran', attachment_deleted: 'Lampiran dihapus', TASK_CREATED: 'Task dibuat',
  };
  if (column === 'startDate' || column === 'dueDate') {
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (dateOnly) {
      const parsed = new Date(Date.UTC(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])));
      return parsed.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    }
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  if (column === 'isClientVisible') return value === 'true' ? 'Ya' : 'Tidak';
  const statuses: Record<string, string> = { TODO: 'Belum dimulai', IN_PROGRESS: 'Sedang dikerjakan', DONE: 'Selesai', BLOCKED: 'Terblokir' };
  const priorities: Record<string, string> = { LOW: 'Rendah', MEDIUM: 'Sedang', HIGH: 'Tinggi' };
  return column === 'status' ? statuses[value] || value : column === 'priority' ? priorities[value] || value : value;
}

export function formatAuditColumn(column: string): string {
  const labels: Record<string, string> = {
    title: 'Judul task', description: 'Deskripsi', status: 'Status', priority: 'Prioritas',
    department: 'Departemen', assigneeId: 'Penanggung jawab', isClientVisible: 'Visibilitas client',
    startDate: 'Tanggal mulai', dueDate: 'Tenggat waktu', dependencies: 'Task prasyarat',
    attachment: 'Lampiran ditambahkan', attachment_deleted: 'Lampiran dihapus', TASK_CREATED: 'Task dibuat',
  };
  return labels[column] || column;
}

export function formatDateTime(d: string | Date | null | undefined): string {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '';
  return date.toLocaleString('id-ID');
}

const COLORS = ['#6366f1', '#3b82f6', '#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
export function colorFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return COLORS[Math.abs(h) % COLORS.length];
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}