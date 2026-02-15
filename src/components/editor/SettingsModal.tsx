"use client";

import type { EditorConfig } from "@/lib/editor";
import { Modal, ModalActions } from "./Modal";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EditorConfig;
  onConfigChange: (config: Partial<EditorConfig>) => void;
}

export function SettingsModal({ isOpen, onClose, config, onConfigChange }: SettingsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Content Root</label>
          <input
            type="text"
            value={config.contentRoot}
            onChange={(e) => onConfigChange({ contentRoot: e.target.value })}
            className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          />
        </div>
      </div>

      <ModalActions>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Done
        </button>
      </ModalActions>
    </Modal>
  );
}
