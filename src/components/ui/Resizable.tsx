"use client";

import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";

interface ResizeHandleProps {
  onResizeStart: (e: React.MouseEvent) => void;
  isResizing: boolean;
}

export function ResizeHandle({ onResizeStart, isResizing }: ResizeHandleProps) {
  return (
    <div
      className={`w-1 cursor-col-resize bg-border hover:bg-blue-500 transition-colors shrink-0 ${isResizing ? "!bg-blue-500" : ""}`}
      onMouseDown={onResizeStart}
    />
  );
}

interface TwoPaneResizerProps {
  children: [ReactNode, ReactNode];
  onWidthsChange?: (widths: [number, number]) => void;
  initialWidths?: [number, number];
  minWidthPercent?: number;
  maxWidthPercent?: number;
  className?: string;
}

export function TwoPaneResizer({
  children,
  onWidthsChange,
  initialWidths = [50, 50],
  minWidthPercent = 25,
  maxWidthPercent = 75,
  className = "",
}: TwoPaneResizerProps) {
  const [widths, setWidths] = useState<[number, number]>(initialWidths);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthsRef = useRef<[number, number]>(initialWidths);

  useEffect(() => {
    setWidths(initialWidths);
  }, [initialWidths]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthsRef.current = [...widths] as [number, number];
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [widths]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const containerWidth = containerRef.current.offsetWidth;
      const delta = e.clientX - startXRef.current;
      const deltaPercent = (delta / containerWidth) * 100;
      
      const newFirst = Math.min(
        maxWidthPercent,
        Math.max(minWidthPercent, startWidthsRef.current[0] + deltaPercent)
      );
      const newSecond = 100 - newFirst;
      
      const newWidths: [number, number] = [newFirst, newSecond];
      setWidths(newWidths);
      onWidthsChange?.(newWidths);
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
  }, [isResizing, minWidthPercent, maxWidthPercent, onWidthsChange]);

  return (
    <div ref={containerRef} className={`flex h-full ${className}`}>
      <div style={{ width: `${widths[0]}%` }} className="h-full min-w-0 overflow-hidden flex flex-col">
        {children[0]}
      </div>
      <ResizeHandle onResizeStart={handleMouseDown} isResizing={isResizing} />
      <div style={{ width: `${widths[1]}%` }} className="h-full min-w-0 overflow-hidden flex flex-col">
        {children[1]}
      </div>
    </div>
  );
}

interface SinglePaneWithSpacerProps {
  children: ReactNode;
  spacerPercent?: number;
  className?: string;
}

export function SinglePaneWithSpacer({
  children,
  spacerPercent = 50,
  className = "",
}: SinglePaneWithSpacerProps) {
  return (
    <div className={`flex h-full ${className}`}>
      <div style={{ width: `${100 - spacerPercent}%` }} className="bg-black/50" />
      <div style={{ width: `${spacerPercent}%` }} className="h-full min-w-0 overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
}
