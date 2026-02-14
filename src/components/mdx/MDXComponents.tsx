import type { MDXComponents } from "mdx/types";
import { MermaidLazy } from "./MermaidLazy";
import { Callout } from "./Callout";
import { PDFViewerLazy } from "./PDFViewerLazy";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    a: ({ href, children, ...props }) => {
      const isExternal = href?.startsWith("http") || href?.startsWith("//") || href?.startsWith("#");
      if (isExternal) {
        return (
          <a
            href={href}
            target={href?.startsWith("http") ? "_blank" : undefined}
            rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
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
