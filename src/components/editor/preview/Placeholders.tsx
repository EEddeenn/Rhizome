"use client";

import dynamic from "next/dynamic";

const PDFViewerInner = dynamic(
  () => import("@/components/mdx/PDFViewer/PDFViewerInner").then((mod) => mod.PDFViewerInner),
  {
    ssr: false,
    loading: () => (
      <div className="my-4 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 animate-pulse h-[50vh]">
        <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
          Loading PDF viewer...
        </div>
      </div>
    ),
  }
);

function getPDFPath(src: string | undefined): string {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/")) {
    return src;
  }
  return `/assets/pdfs/${src}`;
}

export function PreviewPDFViewer({ src, initialPage }: { src?: string; initialPage?: number }) {
  if (!src) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-600 dark:text-red-400 my-4">
        PDF Viewer: No source provided
      </div>
    );
  }

  return (
    <PDFViewerInner
      src={getPDFPath(src)}
      initialPage={initialPage || 1}
      height="50vh"
    />
  );
}

export function PreviewEmbedError({ target, reason }: { target?: string; reason?: string }) {
  return (
    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-600 dark:text-red-400 my-4">
      <div className="font-medium mb-1">Embed Not Found</div>
      <div>{target} ({reason})</div>
    </div>
  );
}
