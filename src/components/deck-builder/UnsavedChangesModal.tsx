"use client";

import { useEffect, useRef } from "react";

interface UnsavedChangesModalProps {
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

/**
 * Modal that prompts the user to save or discard unsaved changes
 * when attempting to navigate away from the deck builder.
 */
export function UnsavedChangesModal({
  onSave,
  onDiscard,
  onCancel,
  isSaving,
}: UnsavedChangesModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal on escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isSaving) {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel, isSaving]);

  // Focus trap within modal
  useEffect(() => {
    const focusableElements = modalRef.current?.querySelectorAll(
      'button:not([disabled])'
    );
    if (focusableElements && focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={isSaving ? undefined : onCancel}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-md mx-4 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <WarningIcon className="w-6 h-6 text-amber-400" />
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Unsaved Changes
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <p className="text-[var(--foreground-muted)]">
            You have unsaved changes to your deck. Would you like to save them before leaving?
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--surface)] flex justify-end gap-3">
          <button
            onClick={onDiscard}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Discard Changes
          </button>
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="btn-primary px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <LoadingSpinner className="w-4 h-4" />
                Saving...
              </>
            ) : (
              <>
                <SaveIcon className="w-4 h-4" />
                Save & Leave
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

function SaveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
