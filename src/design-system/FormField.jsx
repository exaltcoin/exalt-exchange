import { useId } from "react";
import "./FormField.css";

/*
  FormField never invents validation copy - `error` must be a real
  message the caller derived from actual validation logic (client-
  side format checks or a real backend error), never a placeholder.
*/
export const FormField = ({
  label,
  hint,
  error,
  required = false,
  htmlFor,
  className = "",
  children,
}) => {
  const generatedId = useId();
  const fieldId = htmlFor || generatedId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  const describedBy =
    [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`ex2-field ${className}`.trim()}>
      {label ? (
        <label className="ex2-field__label" htmlFor={fieldId}>
          {label}
          {required ? (
            <span className="ex2-field__required" aria-hidden="true">
              {" "}
              *
            </span>
          ) : null}
        </label>
      ) : null}

      {typeof children === "function"
        ? children({
            id: fieldId,
            "aria-describedby": describedBy,
            "aria-invalid": error ? true : undefined,
            "aria-required": required || undefined,
          })
        : children}

      {hint && !error ? (
        <div id={hintId} className="ex2-field__hint">
          {hint}
        </div>
      ) : null}

      {error ? (
        <div id={errorId} className="ex2-field__error" role="alert">
          {error}
        </div>
      ) : null}
    </div>
  );
};

export default FormField;
