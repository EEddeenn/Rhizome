"use client";

import { createContext, useContext, ReactNode } from "react";

const EmbedPathContext = createContext<string[]>([]);
const PreviewLinkContext = createContext<((href: string) => boolean) | null>(null);

export function useEmbedPath(): string[] {
  return useContext(EmbedPathContext);
}

export function usePreviewLinkClick(): ((href: string) => boolean) | null {
  return useContext(PreviewLinkContext);
}

interface EmbedProviderProps {
  children: ReactNode;
  path?: string[];
  onLinkClick?: (href: string) => boolean;
}

export function EmbedProvider({ children, path = [], onLinkClick }: EmbedProviderProps) {
  return (
    <EmbedPathContext.Provider value={path}>
      <PreviewLinkContext.Provider value={onLinkClick || null}>
        {children}
      </PreviewLinkContext.Provider>
    </EmbedPathContext.Provider>
  );
}

export { EmbedPathContext };
