"use client";

import { useEditor } from "./EditorContext";

export function ConflictModal() {
  const { saveError, reloadRemote, clearSaveError, save, isSaving } = useEditor();

  if (!saveError?.startsWith("CONFLICT:")) {
    return null;
  }

  const handleReload = async () => {
    await reloadRemote();
  };

  const handleOverwrite = async () => {
    if (confirm("Are you sure you want to overwrite the remote version? Your local changes will replace the remote.")) {
      await save();
    }
  };

  const handleCancel = () => {
    clearSaveError();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background border border-border rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <ExclamationIcon />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Remote Has Changed</h3>
            <p className="mt-2 text-sm text-muted">
              The file has been modified on GitHub since you last loaded it. Choose how to proceed:
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-2">
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
            onClick={handleCancel}
            className="w-full px-4 py-2 text-sm font-medium text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <div className="font-medium">Cancel</div>
            <div className="text-xs opacity-75">Keep editing and resolve manually</div>
          </button>
        </div>
      </div>
    </div>
  );
}

function ExclamationIcon() {
  return (
    <svg
      className="w-5 h-5 text-yellow-600 dark:text-yellow-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}
