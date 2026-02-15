"use client";

import type { EditorConfig } from "@/lib/editor";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EditorConfig;
  onConfigChange: (config: Partial<EditorConfig>) => void;
}

export function SettingsModal({ isOpen, onClose, config, onConfigChange }: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background border border-border rounded-lg shadow-lg max-w-sm w-full mx-4 p-6">
        <h3 className="text-lg font-semibold mb-4">Settings</h3>

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

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
