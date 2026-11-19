'use client';

import { useEffect, useRef, useState } from 'react';

interface PdfThumbnailProps {
  url: string;
  alt: string;
  className?: string;
}

export function PdfThumbnail({ url, alt, className }: PdfThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const pdfjs = await import('pdfjs-dist');
        if (!pdfjs.GlobalWorkerOptions.workerSrc) {
          pdfjs.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs';
        }
        const pdf = await pdfjs.getDocument({ url }).promise;
        if (cancelled) return;

        const page = await pdf.getPage(1);
        if (cancelled) return;

        const viewport = page.getViewport({ scale: 1 });
        const targetWidth = 320;
        const scale = targetWidth / viewport.width;
        const scaled = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = scaled.width;
        canvas.height = scaled.height;

        await page.render({ canvasContext: ctx, viewport: scaled, canvas }).promise;
      } catch {
        if (!cancelled) setError(true);
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 text-slate-500 ${
          className || ''
        }`}
      >
        <span className="text-2xl">📄</span>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      aria-label={alt}
      className={`w-full h-full object-cover ${className || ''}`}
    />
  );
}