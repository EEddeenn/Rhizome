"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

interface MermaidProps {
  code: string;
}

export function Mermaid({ code }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useState(false);

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

      mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? "dark" : "default",
        securityLevel: "loose",
      });

      try {
        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        const { svg } = await mermaid.render(id, code);
        ref.current.innerHTML = svg;
      } catch (err) {
        ref.current.innerHTML = `<pre class="text-red-500">Mermaid error: ${(err as Error).message}</pre>`;
      }
    };

    render();
  }, [code, isDark]);

  return <div ref={ref} className="my-4 flex justify-center" />;
}
