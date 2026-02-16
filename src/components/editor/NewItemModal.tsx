"use client";

import { useState, useRef } from "react";
import type { EditorConfig } from "@/lib/editor";
import { Modal, ModalActions } from "./Modal";

interface NewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateNote: (path: string, content: string) => Promise<void>;
  onUploadPdf: (path: string, content: string) => Promise<void>;
  config: EditorConfig;
}

export function NewItemModal({ isOpen, onClose, onCreateNote, onUploadPdf, config }: NewItemModalProps) {
  const [tab, setTab] = useState<"note" | "pdf">("note");
  const [newNoteName, setNewNoteName] = useState("");
  const [newNoteType, setNewNoteType] = useState<"note" | "article">("note");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfName, setPdfName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateNote = async () => {
    if (!newNoteName.trim()) return;

    const slug = newNoteName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const path = `${config.contentRoot}/${newNoteType}s/${slug}.mdx`;
    const defaultContent = `---
title: "${newNoteName}"
date: "${new Date().toISOString().split("T")[0]}"
type: "${newNoteType}"
tags: []
---

Content goes here.
`;

    await onCreateNote(path, defaultContent);
    resetAndClose();
  };

  const handleUploadPdf = async () => {
    if (!pdfFile) return;

    setIsUploading(true);
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );

      const fileName = pdfName.trim() || pdfFile.name.replace(/\.pdf$/i, "");
      const slug = fileName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const path = `${config.contentRoot}/assets/pdfs/${slug}.pdf`;

      await onUploadPdf(path, base64);
      resetAndClose();
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      setPdfName(file.name.replace(/\.pdf$/i, ""));
    }
  };

  const resetAndClose = () => {
    setNewNoteName("");
    setNewNoteType("note");
    setPdfFile(null);
    setPdfName("");
    setTab("note");
    onClose();
  };

  const handleClose = () => {
    resetAndClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New">
      <div className="space-y-3">
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <button
            onClick={() => setTab("note")}
            className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
              tab === "note"
                ? "bg-white dark:bg-gray-700 shadow-sm"
                : "hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            Note / Article
          </button>
          <button
            onClick={() => setTab("pdf")}
            className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
              tab === "pdf"
                ? "bg-white dark:bg-gray-700 shadow-sm"
                : "hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            PDF
          </button>
        </div>

        {tab === "note" && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                placeholder="Note title"
                value={newNoteName}
                onChange={(e) => setNewNoteName(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleCreateNote()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <div className="flex gap-2">
                {(["note", "article"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setNewNoteType(type)}
                    className={`flex-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      newNoteType === type
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === "pdf" && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">PDF File</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-gray-100 dark:file:bg-gray-800 file:hover:bg-gray-200 dark:file:hover:bg-gray-700"
              />
            </div>

            {pdfFile && (
              <div>
                <label className="block text-sm font-medium mb-1">Name (optional)</label>
                <input
                  type="text"
                  placeholder={pdfFile.name.replace(/\.pdf$/i, "")}
                  value={pdfName}
                  onChange={(e) => setPdfName(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              </div>
            )}
          </>
        )}
      </div>

      <ModalActions>
        <button
          onClick={handleClose}
          className="px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          Cancel
        </button>
        {tab === "note" ? (
          <button
            onClick={handleCreateNote}
            disabled={!newNoteName.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            Create
          </button>
        ) : (
          <button
            onClick={handleUploadPdf}
            disabled={!pdfFile || isUploading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {isUploading ? "Uploading..." : "Upload"}
          </button>
        )}
      </ModalActions>
    </Modal>
  );
}
