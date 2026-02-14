"use client";

import { useEffect, useRef, useState, useMemo } from "react";

interface MermaidProps {
  code: string;
}

export function Mermaid({ code }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const id = useMemo(() => `mermaid-${Math.random().toString(36).slice(2)}`, []);

  useEffect(() => {
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
    if (!ref.current) return;

    const render = async () => {
      if (!ref.current) return;

      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? "dark" : "default",
          securityLevel: "loose",
        });
        const { svg } = await mermaid.render(id, code);
        if (ref.current) {
          ref.current.innerHTML = svg;
        }
        setError(null);
      } catch (err) {
        setError(`Mermaid error: ${(err as Error).message}`);
      }
    };

    render();
  }, [code, isDark, id]);

  if (error) {
    return <pre className="text-red-500 my-4">{error}</pre>;
  }

  return <div ref={ref} className="my-4 flex justify-center" />;
}
