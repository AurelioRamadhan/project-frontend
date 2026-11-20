import axios from 'axios';

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { error?: string; message?: string; details?: Array<{ message?: string; path?: PropertyKey[] }> }
      | undefined;
    const validation = data?.details
      ?.map((issue) => {
        const field = issue.path?.length ? `${issue.path.join('.')}: ` : '';
        return issue.message ? `${field}${issue.message}` : '';
      })
      .filter(Boolean)
      .join(' ');
    if (validation) return `${data?.error || 'Validasi gagal'}. ${validation}`;
    if (error.response?.status === 409) {
      return data?.error || 'Data berubah di pengguna lain. Muat ulang dan coba lagi.';
    }
    if (data?.error || data?.message) return data.error || data.message || fallback;
    if (!error.response) return 'Tidak dapat terhubung ke server. Periksa koneksi dan coba lagi.';
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
