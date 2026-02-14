"use client";

import { useEffect, useRef, useState } from "react";

interface MermaidProps {
  code: string;
  title?: string;
}

export function Mermaid({ code, title }: MermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const idRef = useRef(`mermaid-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    setMounted(true);
    
    const html = document.documentElement;
    setIsDark(html.classList.contains("dark"));

    const observer = new MutationObserver(() => {
      setIsDark(html.classList.contains("dark"));
    });

    observer.observe(html, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!mounted || !code) return;

    let cancelled = false;

    const renderDiagram = async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? "dark" : "default",
          securityLevel: "loose",
        });

        const { svg: renderedSvg } = await mermaid.render(idRef.current, code);
        
        if (!cancelled) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : String(err);
          console.error("Mermaid render error:", err);
          setError(message);
          setSvg(null);
        }
      }
    };

    renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [mounted, code, isDark]);

  if (!code) {
    return null;
  }

  if (!mounted) {
    return (
      <div className="my-4">
        {title && (
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{title}</p>
        )}
        <div className="flex justify-center">
          <div className="animate-pulse h-32 w-full max-w-md bg-gray-100 dark:bg-gray-800 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-4">
        {title && (
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{title}</p>
        )}
        <pre className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm overflow-auto rounded">
          {error}
        </pre>
      </div>
    );
  }

  return (
    <div className="my-4">
      {title && (
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{title}</p>
      )}
      <div
        ref={containerRef}
        className="flex justify-center overflow-x-auto"
        dangerouslySetInnerHTML={svg ? { __html: svg } : { __html: "" }}
      />
    </div>
  );
}
