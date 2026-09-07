import "./ConfirmationDialog.css";
import { Dialog } from "./Dialog.jsx";
import { Button } from "./Button.jsx";

/*
  ConfirmationDialog is a presentation/safety primitive, NOT a
  financial-calculation engine. Every value shown (amount, price,
  fee, network, estimated received, etc.) must be supplied by the
  caller from real, already-computed backend/state values. This
  component:
    - never computes a fee, total, or converted amount itself,
    - never defaults a missing field to a guessed value (a field
      the caller doesn't pass simply isn't rendered - no "N/A"
      invented in its place unless the caller explicitly says so),
    - always requires an explicit confirming action (button click),
      never auto-confirms on a timer or on mount,
    - defaults to NOT dismissible via Escape/backdrop for
      "danger" tone (e.g. withdrawals, security changes) unless the
      caller explicitly opts back in, since those are exactly the
      accidental-dismissal-sensitive actions called out by the
      redesign safety rules.

  rows: [{ label, value, tone? }] - tone lets a row be highlighted
  (e.g. "fee" in a neutral tone, "amount to withdraw" in a stronger
  tone) without this component deciding what any value means.
*/
export const ConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  tone = "neutral",
  rows = [],
  warning,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirming = false,
  disabled = false,
  dismissOnEscape,
  dismissOnBackdrop,
}) => {
  const isSensitive = tone === "danger";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      dismissOnEscape={dismissOnEscape ?? !isSensitive}
      dismissOnBackdrop={dismissOnBackdrop ?? !isSensitive}
      className="ex2-confirmation-dialog"
    >
      <dl className="ex2-confirmation-dialog__rows">
        {rows.map((row) => (
          <div
            key={row.label}
            className={`ex2-confirmation-dialog__row ex2-confirmation-dialog__row--${row.tone || "neutral"}`}
          >
            <dt>{row.label}</dt>
            <dd className="ex2-nums">{row.value}</dd>
          </div>
        ))}
      </dl>

      {warning ? (
        <div className="ex2-confirmation-dialog__warning" role="alert">
          {warning}
        </div>
      ) : null}

      <div className="ex2-confirmation-dialog__actions">
        <Button variant="ghost" onClick={onClose} disabled={confirming}>
          {cancelLabel}
        </Button>
        <Button
          variant={isSensitive ? "danger" : "primary"}
          onClick={onConfirm}
          loading={confirming}
          disabled={disabled}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
};

export default ConfirmationDialog;
