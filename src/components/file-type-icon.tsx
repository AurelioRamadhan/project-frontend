'use client';

import {
  FileText,
  FileImage,
  FileArchive,
  FileSpreadsheet,
  FileVideo,
  FileAudio,
  Presentation,
  File as FileIcon,
} from 'lucide-react';

interface Props {
  mimeType: string;
  size?: number;
  className?: string;
}

export function FileTypeIcon({ mimeType, size = 18, className = '' }: Props) {
  if (!mimeType) return <FileIcon size={size} className={className} />;
  if (mimeType.startsWith('image/')) return <FileImage size={size} className={className} />;
  if (mimeType === 'application/pdf') return <FileText size={size} className={className} />;
  if (mimeType.includes('zip') || mimeType.includes('rar'))
    return <FileArchive size={size} className={className} />;
  if (mimeType.includes('sheet') || mimeType.includes('excel'))
    return <FileSpreadsheet size={size} className={className} />;
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint'))
    return <Presentation size={size} className={className} />;
  if (mimeType.startsWith('video/')) return <FileVideo size={size} className={className} />;
  if (mimeType.startsWith('audio/')) return <FileAudio size={size} className={className} />;
  if (mimeType.startsWith('text/') || mimeType.includes('word'))
    return <FileText size={size} className={className} />;
  return <FileIcon size={size} className={className} />;
}