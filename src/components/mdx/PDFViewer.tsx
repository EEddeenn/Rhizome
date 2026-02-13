"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

const PDFViewerInner = dynamic(
  () => import("./PDFViewerInner").then((mod) => mod.PDFViewerInner),
  { 
    ssr: false,
    loading: () => (
      <div className="pdf-viewer border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 animate-pulse h-[60vh] sm:h-[80vh]">
        <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm sm:text-base">
          Loading PDF viewer...
        </div>
      </div>
    ),
  }
);

interface PDFViewerProps {
  src: string;
  id?: string;
  title?: string;
  height?: string;
  showThumbnails?: boolean;
}

function PDFViewerWithParams({ src, id, height }: PDFViewerProps) {
  const searchParams = useSearchParams();
  const [initialPage, setInitialPage] = useState<number>(1);

  useEffect(() => {
    const paramKey = id ? `pdfPage_${id}` : "pdfPage";
    const pageParam = searchParams.get(paramKey);
    if (pageParam) {
      const page = parseInt(pageParam, 10);
      if (!isNaN(page) && page > 0) {
        setInitialPage(page);
      }
    }
  }, [searchParams, id]);

  return (
    <PDFViewerInner 
      src={src} 
      height={height} 
      initialPage={initialPage} 
    />
  );
}

export function PDFViewer(props: PDFViewerProps) {
  const fallbackHeight = props.height ? undefined : "h-[60vh] sm:h-[80vh]";
  
  return (
    <Suspense 
      fallback={
        <div className={`pdf-viewer border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 animate-pulse ${fallbackHeight || ""}`} style={props.height ? { height: props.height } : undefined}>
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm sm:text-base">
            Loading PDF viewer...
          </div>
        </div>
      }
    >
      <PDFViewerWithParams {...props} />
    </Suspense>
  );
}
