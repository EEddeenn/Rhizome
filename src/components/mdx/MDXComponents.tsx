import type { MDXComponents } from "mdx/types";
import { MermaidLazy } from "./MermaidLazy";
import { Callout } from "./Callout";
import { PDFViewerLazy } from "./PDFViewerLazy";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    a: ({ href, children, ...props }) => {
      const isExternal = href?.startsWith("http");
      if (isExternal) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          >
            {children}
          </a>
        );
      }
      return <a href={href} {...props}>{children}</a>;
    },
    table: ({ children }) => (
      <div className="overflow-x-auto">
        <table>{children}</table>
      </div>
    ),
    Mermaid: MermaidLazy,
    Callout,
    PDFViewer: PDFViewerLazy,
    ...components,
  };
}
