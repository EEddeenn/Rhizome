"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import type { VaultAdapter } from "@/lib/editor";
import { fetchPdfContent, type PdfFetchResult } from "@/lib/editor";

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

function isPdfFetchResult(result: unknown): result is PdfFetchResult {
  return typeof result === "object" && result !== null && "blobUrl" in result && "source" in result;
}

interface EditorPDFViewerProps {
  path: string;
  adapter: VaultAdapter | null;
  height?: string;
}

export function EditorPDFViewer({ path, adapter, height }: EditorPDFViewerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    }

    const loadPdf = async () => {
      setLoading(true);
      setError(null);

      const result = await fetchPdfContent(path, adapter);
      
      if (isPdfFetchResult(result)) {
        if (result.source === "github") {
          objectUrlRef.current = result.blobUrl;
        }
        setBlobUrl(result.blobUrl);
        setLoading(false);
        return;
      }
      
      setError(result.error);
      setLoading(false);
    };

    loadPdf();

    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [adapter, path]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-600 dark:text-red-400 m-4">
        <p className="font-medium">Failed to load PDF</p>
        <p className="mt-1">{error}</p>
      </div>
    );
  }

  if (!blobUrl) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-600 dark:text-red-400 m-4">
        PDF Viewer: No source provided
      </div>
    );
  }

  return (
    <PDFViewerInner
      src={blobUrl}
      height={height || "100%"}
    />
  );
}

function getPDFPath(src: string | undefined): string {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/")) {
    return src;
  }
  return `/assets/pdfs/${src}`;
}

export function PreviewPDFViewer({ src, initialPage, height }: { src?: string; initialPage?: string | number; height?: string }) {
  if (!src) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-600 dark:text-red-400 my-4">
        PDF Viewer: No source provided
      </div>
    );
  }

  const page = typeof initialPage === "string" ? parseInt(initialPage, 10) : initialPage;

  return (
    <PDFViewerInner
      src={getPDFPath(src)}
      initialPage={page || 1}
      height={height || "50vh"}
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
