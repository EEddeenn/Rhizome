import type { MDXComponents } from "mdx/types";
import { Mermaid } from "./Mermaid";
import { Callout } from "./Callout";
import { PDFViewer } from "./PDFViewer";

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
    Mermaid,
    Callout,
    PDFViewer,
    ...components,
  };
}
