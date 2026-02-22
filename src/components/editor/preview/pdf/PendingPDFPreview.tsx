"use client";

import { useState, useEffect, useRef } from "react";
import type { PendingChange } from "@/lib/editor/pending-changes";
import dynamic from "next/dynamic";

const PDFViewerInner = dynamic(
  () => import("@/components/mdx/PDFViewer/PDFViewerInner").then((mod) => mod.PDFViewerInner),
  { ssr: false }
);

interface PendingPDFPreviewProps {
  pendingChange: PendingChange;
}

export function PendingPDFPreview({ pendingChange }: PendingPDFPreviewProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pendingChange.content || !pendingChange.isBinary) {
      return;
    }

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
    } catch (e) {
      console.error("Failed to create PDF blob:", e);
    }

    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [pendingChange.content, pendingChange.isBinary]);

  if (!blobUrl) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin w-6 h-6 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full" />
      </div>
    );
  }

  return (
    <PDFViewerInner src={blobUrl} height="100%" />
  );
}
