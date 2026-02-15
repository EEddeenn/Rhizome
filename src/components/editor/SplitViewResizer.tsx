"use client";

import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";

interface SplitViewResizerProps {
  children: [ReactNode, ReactNode];
  previewPercent: number;
  onPreviewPercentChange: (percent: number) => void;
  minPreviewPercent: number;
  maxPreviewPercent: number;
}

export function SplitViewResizer({
  children,
  previewPercent,
  onPreviewPercentChange,
  minPreviewPercent,
  maxPreviewPercent,
}: SplitViewResizerProps) {
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startPercentRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startPercentRef.current = previewPercent;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [previewPercent]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const containerWidth = containerRef.current.offsetWidth;
      const delta = startXRef.current - e.clientX;
      const deltaPercent = (delta / containerWidth) * 100;
      const newPercent = Math.min(
        maxPreviewPercent,
        Math.max(minPreviewPercent, startPercentRef.current + deltaPercent)
      );
      onPreviewPercentChange(newPercent);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, minPreviewPercent, maxPreviewPercent, onPreviewPercentChange]);

  const editorPercent = 100 - previewPercent;

  return (
    <div ref={containerRef} className="flex-1 flex min-w-0 h-full">
      <div style={{ width: `${editorPercent}%` }} className="h-full min-w-0">
        {children[0]}
      </div>
      <div
        className={`w-1 cursor-col-resize hover:bg-blue-500/50 transition-colors shrink-0 ${isResizing ? "bg-blue-500" : ""}`}
        onMouseDown={handleMouseDown}
      />
      <div style={{ width: `${previewPercent}%` }} className="h-full min-w-0">
        {children[1]}
      </div>
    </div>
  );
}
