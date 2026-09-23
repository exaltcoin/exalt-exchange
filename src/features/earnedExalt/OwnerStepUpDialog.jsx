import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../../design-system/Button.jsx";
import { Dialog } from "../../design-system/Dialog.jsx";
import { FormField } from "../../design-system/FormField.jsx";
import { Input } from "../../design-system/Input.jsx";
import { requestOwnerStepUp } from "./earnedExaltApi.js";
import "../../design-system/ConfirmationDialog.css";

const VALID_TOTP = /^\d{6}$/;
const INVALID_GRANT_MESSAGE = "Invalid step-up grant. Please try again.";

export function OwnerStepUpDialog({ open, onCancel, onVerified, scope = "earned_exalt" }) {
  const [totp, setTotp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);

  useEffect(() => {
    if (!open && !busy.current) {
      setTotp("");
      setError("");
    }
  }, [open]);

  const cancel = useCallback(() => {
    if (busy.current) return;
    setTotp("");
    setError("");
    onCancel?.();
  }, [onCancel]);

  const verify = async (event) => {
    event.preventDefault();
    if (busy.current || !VALID_TOTP.test(totp)) return;
    busy.current = true;
    setSubmitting(true);
    setError("");
    try {
      const result = await requestOwnerStepUp(
        scope === "earned_exalt" ? { token: totp } : { token: totp, scope }
      );
      setTotp("");
      const expiresAt = new Date(result?.expiresAt).getTime();
      if (
        result?.success !== true ||
        typeof result.stepUpToken !== "string" ||
        !result.stepUpToken ||
        result.scope !== scope ||
        !Number.isFinite(expiresAt) ||
        expiresAt <= Date.now()
      ) {
        throw new Error(INVALID_GRANT_MESSAGE);
      }
      onVerified?.({ token: result.stepUpToken, scope: result.scope, expiresAt: result.expiresAt });
    } catch (failure) {
      setTotp("");
      setError(failure?.message || "Step-up verification failed. Please try again.");
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  };

  const valid = VALID_TOTP.test(totp);
  return (
    <Dialog open={open} onClose={cancel} title="Owner verification required" dismissOnEscape={!submitting} dismissOnBackdrop={!submitting}>
      <form onSubmit={verify}>
        <p>Enter the current six-digit code from your authenticator app to continue.</p>
        <FormField label="Authenticator code" hint="Enter exactly six digits." error={error} required>
          {(fieldProps) => (
            <Input
              {...fieldProps}
              aria-label="Authenticator code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={totp}
              disabled={submitting}
              onChange={(event) => { setTotp(event.target.value); if (error) setError(""); }}
            />
          )}
        </FormField>
        <div className="ex2-confirmation-dialog__actions">
          <Button variant="ghost" onClick={cancel} disabled={submitting}>Cancel</Button>
          <Button type="submit" loading={submitting} disabled={!valid || submitting}>Verify</Button>
        </div>
      </form>
    </Dialog>
  );
}

export default OwnerStepUpDialog;
