"use client";

import { useState, useEffect, useRef } from "react";
import { pendingChanges } from "@/lib/editor/pending-changes";
import dynamic from "next/dynamic";

const PDFViewerInner = dynamic(
  () => import("@/components/mdx/PDFViewer/PDFViewerInner").then((mod) => mod.PDFViewerInner),
  { ssr: false }
);

interface EditorPreviewPDFViewerProps {
  src?: string;
  initialPage?: string | number;
  height?: string;
}

export function EditorPreviewPDFViewer({ src, initialPage, height }: EditorPreviewPDFViewerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isPending, setIsPending] = useState<boolean | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!src) {
      setIsPending(null);
      setBlobUrl(null);
      return;
    }
    
    const path = `content${src}`;
    const pendingChange = pendingChanges.getChange(path);
    const pending = pendingChange?.type === "create" && 
      pendingChange.isBinary === true && 
      !!pendingChange.content;
    
    setIsPending(pending);

    if (pending && pendingChange?.content) {
      try {
        const binaryString = atob(pendingChange.content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
        }
        blobUrlRef.current = url;
        setBlobUrl(url);
      } catch {
        setBlobUrl(null);
      }
    } else {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      setBlobUrl(null);
    }
  }, [src]);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  if (!src) {
    return (
      <div className="my-4 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
        <div className="p-4 text-gray-500 dark:text-gray-400 text-sm">
          PDF Viewer: No source provided
        </div>
      </div>
    );
  }

  if (isPending === null || (isPending && !blobUrl)) {
    return (
      <div className="my-4 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
        <div className="h-[50vh] flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm animate-pulse">
          Loading PDF viewer...
        </div>
      </div>
    );
  }

  if (isPending && blobUrl) {
    const page = typeof initialPage === "string" ? parseInt(initialPage, 10) : initialPage;
    
    return (
      <div className="my-4 border border-yellow-300 dark:border-yellow-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
        <div className="px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-700 text-xs text-yellow-700 dark:text-yellow-300">
          PDF preview from local data (pending sync)
        </div>
        <PDFViewerInner src={blobUrl} initialPage={page || 1} height={height || "50vh"} />
      </div>
    );
  }

  return null;
}
