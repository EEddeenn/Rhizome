"use client";

import { type ReactNode } from "react";
import { ContentReadyProvider } from "@/components/context/ContentReadyContext";

interface ClientProvidersProps {
  children: ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return <ContentReadyProvider>{children}</ContentReadyProvider>;
}
