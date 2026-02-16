"use client";

import { useState, useEffect } from "react";
import type { EditorConfig } from "@/lib/editor";
import { authStore } from "@/lib/editor";
import { Modal, ModalActions } from "./Modal";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EditorConfig;
  onConfigChange: (config: Partial<EditorConfig>) => void;
  onDisconnect?: () => void;
}

export function SettingsModal({ isOpen, onClose, config, onConfigChange, onDisconnect }: SettingsModalProps) {
  const [hasStoredToken, setHasStoredToken] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const token = authStore.getToken();
      setHasStoredToken(token !== null);
    }
  }, [isOpen]);

  const handleClearCredentials = () => {
    authStore.disconnect();
    setHasStoredToken(false);
    onDisconnect?.();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Content Root</label>
          <input
            type="text"
            value={config.contentRoot}
            onChange={(e) => onConfigChange({ contentRoot: e.target.value })}
            className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium">Color Scheme</label>
            <p className="text-xs text-muted">Switch between light and dark mode</p>
          </div>
          <ThemeToggle />
        </div>

        {hasStoredToken && (
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium">Stored Credentials</label>
                <p className="text-xs text-muted">Clear saved GitHub token</p>
              </div>
              <button
                onClick={handleClearCredentials}
                className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}
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
