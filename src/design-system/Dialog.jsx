import { createPortal } from "react-dom";
import { useFocusTrap } from "./useFocusTrap.js";
import "./Dialog.css";

/*
  Real focus trap: Tab/Shift+Tab cycle only within the dialog while
  it's open, Escape closes it (unless dismissOnEscape=false, for
  security-sensitive confirmations that shouldn't be dismissed by
  accident), and focus returns to whatever triggered the dialog on
  close. Background scroll is locked while open. See
  useFocusTrap.js for the shared implementation (also used by
  Drawer).
*/
export const Dialog = ({
  open,
  onClose,
  title,
  children,
  dismissOnEscape = true,
  dismissOnBackdrop = true,
  className = "",
}) => {
  const dialogRef = useFocusTrap({ open, onClose, dismissOnEscape });

  if (!open) return null;

  return createPortal(
    <div
      className="ex2-dialog-overlay"
      onMouseDown={(event) => {
        if (
          dismissOnBackdrop &&
          event.target === event.currentTarget
        ) {
          onClose?.();
        }
      }}
    >
      <div
        ref={dialogRef}
        className={`ex2-dialog ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        tabIndex={-1}
      >
        {title ? (
          <div className="ex2-dialog__header">
            <div className="ex2-dialog__title">{title}</div>
            <button
              type="button"
              className="ex2-dialog__close"
              aria-label="Close"
              onClick={() => onClose?.()}
            >
              ×
            </button>
          </div>
        ) : null}
        <div className="ex2-dialog__body">{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default Dialog;
