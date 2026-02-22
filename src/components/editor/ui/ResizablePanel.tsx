"use client";

import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";

interface ResizablePanelProps {
  children: ReactNode;
  defaultWidth: number;
  minWidth: number;
  maxWidth: number | "remaining";
  side: "left" | "right";
  onSaveWidth?: (width: number) => void;
  savedWidth?: number;
}

export function ResizablePanel({
  children,
  defaultWidth,
  minWidth,
  maxWidth,
  side,
  onSaveWidth,
  savedWidth,
}: ResizablePanelProps) {
  const [width, setWidth] = useState(savedWidth ?? defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [width]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = side === "left" 
        ? e.clientX - startXRef.current 
        : startXRef.current - e.clientX;
      const newWidth = Math.min(maxWidth === "remaining" ? Infinity : maxWidth, Math.max(minWidth, startWidthRef.current + delta));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      onSaveWidth?.(width);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, side, minWidth, maxWidth, onSaveWidth, width]);

  useEffect(() => {
    if (savedWidth !== undefined) {
      setWidth(savedWidth);
    }
  }, [savedWidth]);

  const resizeHandleClass = side === "left" 
    ? "right-0" 
    : "left-0";

  return (
    <div
      ref={panelRef}
      className="relative h-full shrink-0 bg-background"
      style={{ width: `${width}px` }}
    >
      {children}
      <div
        className={`absolute top-0 ${resizeHandleClass} bottom-0 w-1.5 cursor-col-resize group transition-colors z-10`}
        onMouseDown={handleMouseDown}
      >
        <div className={`w-px h-full bg-gray-200 dark:bg-gray-700 group-hover:bg-blue-500 dark:group-hover:bg-blue-400 transition-colors mx-auto ${isResizing ? "!bg-blue-500 dark:!bg-blue-400" : ""}`} />
      </div>
    </div>
  );
}

interface ResizableContainerProps {
  children: ReactNode;
  className?: string;
}

export function ResizableContainer({ children, className = "" }: ResizableContainerProps) {
  return (
    <div className={`flex h-full ${className}`}>
      {children}
    </div>
  );
}
