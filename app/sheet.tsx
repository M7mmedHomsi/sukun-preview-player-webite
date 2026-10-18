"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

/**
 * The app's bottom sheet (SukunSheet): the light gradient card floated 4pt
 * off the edges, 36pt top and 52pt bottom corners, the white grabber, a
 * Heading/M title and Body/M words. A modal <dialog>, so focus stays in it
 * and Escape closes it; a tap outside the card closes it too.
 */
export function Sheet({
  open,
  onClose,
  title,
  body,
  icon,
  children,
  closeLabel,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  body?: string;
  /** Above the title (the app icon, on the get-the-app sheet). */
  icon?: ReactNode;
  children?: ReactNode;
  closeLabel: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      // Focus the card, not its first button: no ring on a sheet opened by
      // a tap, and Tab still walks its buttons.
      d.querySelector<HTMLElement>(".sheet")?.focus();
    }
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className="sheet-layer"
      aria-label={title}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sheet" tabIndex={-1}>
        <div className="grabber" aria-hidden="true" />
        <button type="button" className="sheet-close" aria-label={closeLabel} onClick={onClose}>
          <span aria-hidden="true">×</span>
        </button>
        {icon}
        <h2 className="sheet-title">{title}</h2>
        {body ? <p className="sheet-body">{body}</p> : null}
        {children}
      </div>
    </dialog>
  );
}
