import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/*
  Shared by Dialog and Drawer: real focus trap (Tab/Shift+Tab cycle
  within the container), Escape-to-close (unless dismissOnEscape is
  false, for security-sensitive confirmations), background scroll
  lock while open, and focus restoration to whatever triggered the
  overlay when it closes.

  Returns a ref to attach to the overlay's outermost focusable
  container element.
*/
export const useFocusTrap = ({ open, onClose, dismissOnEscape = true }) => {
  const containerRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    previouslyFocusedRef.current = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusable = () =>
      Array.from(
        containerRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) || []
      );

    (focusable()[0] || containerRef.current)?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && dismissOnEscape) {
        event.stopPropagation();
        onClose?.();
        return;
      }

      if (event.key !== "Tab") return;

      const elements = focusable();
      if (elements.length === 0) {
        event.preventDefault();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.body.style.overflow = originalOverflow;
      previouslyFocusedRef.current?.focus?.();
    };
  }, [open, onClose, dismissOnEscape]);

  return containerRef;
};

export default useFocusTrap;
