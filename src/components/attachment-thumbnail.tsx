'use client';

import { useState } from 'react';
import { Download, Eye, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PdfThumbnail } from './pdf-thumbnail';
import { isImage, isPdf, previewUrl } from '@/lib/attachments';

interface AttachmentThumbnailProps {
  attachment: any;
  onDownload?: () => void;
  onDelete?: () => void;
  deleting?: boolean;
  enablePreviewModal?: boolean;
}

export function AttachmentThumbnail({
  attachment,
  onDownload,
  onDelete,
  deleting,
  enablePreviewModal = true,
}: AttachmentThumbnailProps) {
  const [preview, setPreview] = useState(false);
  const showOverlay = !!(onDownload || onDelete || enablePreviewModal);

  return (
    <>
      <div className="relative overflow-hidden rounded border bg-slate-50 group aspect-square">
        {isImage(attachment.mimeType) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl(attachment.id)}
            alt={attachment.originalName}
            className="w-full h-full object-cover cursor-pointer"
            loading="lazy"
            onClick={() => enablePreviewModal && setPreview(true)}
          />
        )}
        {isPdf(attachment.mimeType) && (
          <div
            className="w-full h-full cursor-pointer"
            onClick={() => enablePreviewModal && setPreview(true)}
          >
            <PdfThumbnail
              url={previewUrl(attachment.id)}
              alt={attachment.originalName}
              className="w-full h-full"
            />
          </div>
        )}

        {showOverlay && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
            {enablePreviewModal && (
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreview(true);
                }}
                title="Preview"
              >
                <Eye size={14} />
              </Button>
            )}
            {onDownload && (
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload();
                }}
                title="Download"
              >
                <Download size={14} />
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="destructive"
                disabled={deleting}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                title="Hapus"
              >
                <Trash2 size={14} />
              </Button>
            )}
          </div>
        )}
      </div>

      {preview && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreview(false)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto p-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreview(false)}
              className="absolute top-2 right-2 p-1 bg-white rounded shadow z-10"
            >
              <X size={18} />
            </button>
            {isImage(attachment.mimeType) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl(attachment.id)}
                alt={attachment.originalName}
                className="max-w-full max-h-[80vh]"
              />
            ) : (
              <iframe
                src={previewUrl(attachment.id)}
                className="w-[80vw] h-[80vh]"
                title={attachment.originalName}
              />
            )}
            <p className="text-xs text-slate-500 mt-2 text-center">
              {attachment.originalName}
            </p>
          </div>
        </div>
      )}
    </>
  );
}