"use client";

import { useNote } from "./contexts/EditorNoteContext";
import { Modal } from "./Modal";
import { ExclamationIcon } from "@/components/icons";

export function ConflictModal() {
  const { saveError, reloadRemote, clearSaveError, save, isSaving } = useNote();

  const isOpen = saveError?.startsWith("CONFLICT:") ?? false;

  const handleReload = async () => {
    await reloadRemote();
  };

  const handleOverwrite = async () => {
    if (confirm("Are you sure you want to overwrite the remote version? Your local changes will replace the remote.")) {
      await save();
    }
  };

  const handleClose = () => {
    clearSaveError();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Remote Has Changed" maxWidth="md">
      <div className="flex items-start gap-3 -mt-2">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
          <ExclamationIcon className="text-yellow-600 dark:text-yellow-400" />
        </div>
        <p className="text-sm text-muted">
          The file has been modified on GitHub since you last loaded it. Choose how to proceed:
        </p>
      </div>

      <div className="mt-4 space-y-2">
        <button
          onClick={handleReload}
          className="w-full px-4 py-2 text-sm font-medium text-left bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
        >
          <div className="font-medium">Reload Remote</div>
          <div className="text-xs opacity-75">Discard your local changes and load the latest version</div>
        </button>

        <button
          onClick={handleOverwrite}
          disabled={isSaving}
          className="w-full px-4 py-2 text-sm font-medium text-left bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
        >
          <div className="font-medium">Overwrite Remote</div>
          <div className="text-xs opacity-75">Force save your changes, replacing the remote version</div>
        </button>

        <button
          onClick={handleClose}
          className="w-full px-4 py-2 text-sm font-medium text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <div className="font-medium">Cancel</div>
          <div className="text-xs opacity-75">Keep editing and resolve manually</div>
        </button>
      </div>
    </Modal>
  );
}
