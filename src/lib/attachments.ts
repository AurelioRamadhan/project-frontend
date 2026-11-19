export const API_URL = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:4000';

export function isImage(mimeType: string): boolean {
  return mimeType?.startsWith('image/') ?? false;
}

export function isPdf(mimeType: string): boolean {
  return mimeType === 'application/pdf';
}

export function isPreviewable(mimeType: string): boolean {
  return isImage(mimeType) || isPdf(mimeType);
}

export function previewUrl(attachmentId: string): string {
  return `${API_URL}/api/attachments/${attachmentId}/preview`;
}

export function downloadUrl(attachmentId: string): string {
  return `${API_URL}/api/attachments/${attachmentId}/download`;
}

export function mimeLabel(mimeType: string): string {
  if (!mimeType) return 'FILE';
  if (isImage(mimeType)) return 'IMAGE';
  if (isPdf(mimeType)) return 'PDF';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'ZIP';
  if (mimeType.includes('word')) return 'DOC';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'XLS';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'PPT';
  if (mimeType.startsWith('video/')) return 'VIDEO';
  if (mimeType.startsWith('audio/')) return 'AUDIO';
  if (mimeType.startsWith('text/')) return 'TEXT';
  return 'FILE';
}