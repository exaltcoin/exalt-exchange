import { createPortal } from "react-dom";
import { useFocusTrap } from "./useFocusTrap.js";
import "./Drawer.css";

/*
  Drawer shares the same focus-trap/scroll-lock/Escape/focus-restore
  behavior as Dialog via the shared useFocusTrap hook - it is a
  visually distinct pattern (slide-in panel, typically used for
  mobile navigation, filters, or a side detail panel) rather than a
  centered confirmation, so it's a separate component instead of a
  Dialog variant, but the accessibility contract is identical.

  `side`: "end" (default - right in LTR, left in RTL, via logical
  properties) or "bottom" (mobile sheet).
*/
export const Drawer = ({
  open,
  onClose,
  title,
  side = "end",
  children,
  dismissOnEscape = true,
  className = "",
}) => {
  const drawerRef = useFocusTrap({ open, onClose, dismissOnEscape });

  if (!open) return null;

  return createPortal(
    <div
      className="ex2-drawer-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        ref={drawerRef}
        className={`ex2-drawer ex2-drawer--${side} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        tabIndex={-1}
      >
        {title ? (
          <div className="ex2-drawer__header">
            <div className="ex2-drawer__title">{title}</div>
            <button
              type="button"
              className="ex2-drawer__close"
              aria-label="Close"
              onClick={() => onClose?.()}
            >
              ×
            </button>
          </div>
        ) : null}
        <div className="ex2-drawer__body">{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default Drawer;
