"use client";

import { useState, useEffect, useCallback, useRef, useId } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

const ChevronLeftIcon = (
  <svg aria-hidden="true" className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = (
  <svg aria-hidden="true" className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const MinusIcon = (
  <svg aria-hidden="true" className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
  </svg>
);

const PlusIcon = (
  <svg aria-hidden="true" className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const CloseIcon = (
  <svg aria-hidden="true" className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const FullscreenIcon = (
  <svg aria-hidden="true" className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4h4M4 16v4h4M20 8V4h-4M20 16v4h-4" />
  </svg>
);

interface PDFDocumentInfo {
  numPages: number;
}

pdfjs.GlobalWorkerOptions.workerSrc = "/generated/vendor/pdf.worker.min.js";

interface PDFViewerInnerProps {
  src: string;
  height?: string;
  initialPage?: number;
}

export function PDFViewerInner({
  src,
  height,
  initialPage = 1,
}: PDFViewerInnerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const numPagesRef = useRef<number>(0);
  const pageInputId = useId();

  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(initialPage);
  const [scale, setScale] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (initialPage) {
      setPageNumber((prev) => (prev !== initialPage ? initialPage : prev));
    }
  }, [initialPage]);

  useEffect(() => {
    const updateWidth = () => {
      if (pageContainerRef.current) {
        const newWidth = pageContainerRef.current.clientWidth;
        setContainerWidth((prev) => (prev !== newWidth ? newWidth : prev));
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const onDocumentLoadSuccess = (pdf: PDFDocumentInfo) => {
    numPagesRef.current = pdf.numPages;
    setNumPages(pdf.numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (err: Error) => {
    setError(err.message);
    setLoading(false);
  };

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= numPagesRef.current) {
      setPageNumber(page);
      pageContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const handleItemClick = useCallback(({ pageNumber: page }: { pageNumber: number }) => {
    goToPage(page);
  }, [goToPage]);

  const goToPrevPage = useCallback(() => {
    goToPage(pageNumber - 1);
  }, [goToPage, pageNumber]);

  const goToNextPage = useCallback(() => {
    goToPage(pageNumber + 1);
  }, [goToPage, pageNumber]);

  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(s + 0.25, 3.0));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((s) => Math.max(s - 0.25, 0.5));
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`pdf-viewer flex flex-col border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 ${!height ? "h-[60vh] sm:h-[80vh]" : ""}`}
      style={height ? { height: isFullscreen ? "100vh" : height } : isFullscreen ? { height: "100vh" } : undefined}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 sm:px-3 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
        <div className="flex items-center gap-2 order-2 sm:order-1 w-full sm:w-auto justify-center sm:justify-start">
          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            {loading ? "Loading…" : error ? "Error" : `${pageNumber} / ${numPages}`}
          </span>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1 order-1 sm:order-2">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1 || loading || !!error}
            className="p-1.5 sm:p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Previous page"
          >
            {ChevronLeftIcon}
          </button>

          <label htmlFor={pageInputId} className="sr-only">
            Page number
          </label>
          <input
            id={pageInputId}
            type="number"
            name="page"
            value={pageNumber}
            onChange={(e) => {
              const page = parseInt(e.target.value, 10);
              if (!isNaN(page)) {
                goToPage(page);
              }
            }}
            min={1}
            max={numPages}
            className="w-10 sm:w-12 px-1 py-1 sm:py-0.5 text-sm text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            disabled={loading || !!error}
          />

          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages || loading || !!error}
            className="p-1.5 sm:p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Next page"
          >
            {ChevronRightIcon}
          </button>

          <div className="hidden sm:block w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />

          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="p-1.5 sm:p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Zoom out"
          >
            {MinusIcon}
          </button>

          <span className="hidden sm:block text-xs text-gray-600 dark:text-gray-400 w-10 text-center">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={zoomIn}
            disabled={scale >= 3.0}
            className="p-1.5 sm:p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Zoom in"
          >
            {PlusIcon}
          </button>

          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-0.5 sm:mx-1" />

          <button
            onClick={toggleFullscreen}
            className="p-1.5 sm:p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? CloseIcon : FullscreenIcon}
          </button>
        </div>
      </div>

      <div
        ref={pageContainerRef}
        className="flex-1 min-h-0 overflow-auto"
      >
        {error ? (
          <div className="flex items-center justify-center h-full text-red-500 dark:text-red-400 p-4 text-center">
            <p>Failed to load PDF: {error}</p>
          </div>
        ) : (
          <Document
            file={src}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            onItemClick={handleItemClick}
            loading={
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400">Loading PDF…</p>
              </div>
            }
          >
            <div className="flex justify-center py-2 sm:py-4">
              <Page
                pageNumber={pageNumber}
                scale={scale}
                width={containerWidth ? containerWidth * scale : undefined}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </div>
          </Document>
        )}
      </div>
    </div>
  );
}
