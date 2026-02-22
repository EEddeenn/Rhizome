"use client";

import { EditorProvider } from "./providers/EditorProvider";
import { EditorLayout } from "./layout/EditorLayout";

export function Editor() {
  return (
    <EditorProvider>
      <EditorLayout />
    </EditorProvider>
  );
}
