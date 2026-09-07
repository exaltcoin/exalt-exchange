import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import "./Toast.css";

const ToastContext = createContext(null);

const TONES = ["info", "success", "warning", "danger"];

/*
  Toasts must be raised from real outcomes the caller already knows
  (a request resolved, a request failed) - never speculatively
  before a request completes. showToast() takes plain data, no
  default success/failure copy of its own.
*/
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const idCounter = useRef(0);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ tone = "info", title, description, duration = 5000 }) => {
      idCounter.current += 1;
      const id = idCounter.current;
      const safeTone = TONES.includes(tone) ? tone : "info";

      setToasts((current) => [
        ...current,
        { id, tone: safeTone, title, description },
      ]);

      if (duration && duration > 0) {
        setTimeout(() => dismissToast(id), duration);
      }

      return id;
    },
    [dismissToast]
  );

  const value = useMemo(
    () => ({ showToast, dismissToast }),
    [showToast, dismissToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          className="ex2-toast-region"
          role="region"
          aria-label="Notifications"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`ex2-toast ex2-toast--${toast.tone}`}
              role={
                toast.tone === "danger" || toast.tone === "warning"
                  ? "alert"
                  : "status"
              }
            >
              {toast.title ? (
                <div className="ex2-toast__title">{toast.title}</div>
              ) : null}
              {toast.description ? (
                <div className="ex2-toast__description">
                  {toast.description}
                </div>
              ) : null}
              <button
                type="button"
                className="ex2-toast__close"
                aria-label="Dismiss notification"
                onClick={() => dismissToast(toast.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
};

export default ToastProvider;
