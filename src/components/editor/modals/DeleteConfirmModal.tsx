"use client";

import type { MergedEntry } from "@/lib/manifest";
import { Modal, ModalActions } from "../ui/Modal";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  currentNote: MergedEntry | null;
  isDeleting: boolean;
}

export function DeleteConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  currentNote, 
  isDeleting 
}: DeleteConfirmModalProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Note">
      <p className="text-sm text-muted">
        Are you sure you want to delete <span className="font-medium text-foreground">{currentNote?.title}</span>? This action cannot be undone.
      </p>

      <ModalActions>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={isDeleting}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </ModalActions>
    </Modal>
  );
}
