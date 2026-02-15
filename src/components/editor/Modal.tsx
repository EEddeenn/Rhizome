"use client";

import type { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg";
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export function Modal({ isOpen, onClose, title, children, maxWidth = "sm" }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-background border border-border rounded-lg shadow-lg ${maxWidthClasses[maxWidth]} w-full mx-4 p-6`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <h3 id="modal-title" className="text-lg font-semibold mb-4">
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
}

interface ModalActionsProps {
  children: ReactNode;
}

export function ModalActions({ children }: ModalActionsProps) {
  return <div className="flex justify-end gap-2 mt-6">{children}</div>;
}
