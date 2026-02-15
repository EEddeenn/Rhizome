"use client";

export function PreviewMermaid({ code }: { code?: string }) {
  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-mono overflow-x-auto my-4">
      <div className="text-xs text-muted mb-2">Mermaid Diagram</div>
      <pre>{code}</pre>
    </div>
  );
}

export function PreviewPDFViewer({ src, initialPage }: { src?: string; initialPage?: number }) {
  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm my-4">
      <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">PDF Viewer</div>
      <div>{src}{initialPage ? ` (page ${initialPage})` : ""}</div>
    </div>
  );
}

export function PreviewNoteEmbed({ slug, anchor, blockId }: { slug?: string; anchor?: string; blockId?: string }) {
  return (
    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm my-4">
      <div className="text-xs text-green-600 dark:text-green-400 mb-1">Embedded Note</div>
      <div>{slug}{anchor ? `#${anchor}` : ""}{blockId ? `#^${blockId}` : ""}</div>
    </div>
  );
}

export function PreviewEmbedError({ target, reason }: { target?: string; reason?: string }) {
  return (
    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-600 dark:text-red-400 my-4">
      <div className="font-medium mb-1">Embed Not Found</div>
      <div>{target} ({reason})</div>
    </div>
  );
}
