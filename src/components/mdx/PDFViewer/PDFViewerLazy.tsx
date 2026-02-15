"use client";

import dynamic from "next/dynamic";

const PDFViewerInner = dynamic(
  () => import("./PDFViewer").then((mod) => mod.PDFViewer),
  {
    ssr: false,
    loading: () => (
      <div className="my-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="animate-pulse h-96 bg-gray-100 dark:bg-gray-800" />
      </div>
    ),
  }
);

interface PDFViewerProps {
  src: string;
  id?: string;
  height?: string;
}

export function PDFViewerLazy({ src, id, height }: PDFViewerProps) {
  return <PDFViewerInner src={src} id={id} height={height} />;
}
