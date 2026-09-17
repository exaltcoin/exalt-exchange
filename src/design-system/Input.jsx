import { forwardRef } from "react";
import "./Input.css";

export const Input = forwardRef(function Input(
  {
    invalid = false,
    disabled = false,
    size = "md",
    startAdornment,
    endAdornment,
    className = "",
    ...rest
  },
  ref
) {
  const classes = [
    "ex2-input-wrap",
    `ex2-input-wrap--${size}`,
    invalid ? "ex2-input-wrap--invalid" : "",
    disabled ? "ex2-input-wrap--disabled" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      {startAdornment ? (
        <span className="ex2-input__adornment ex2-input__adornment--start">
          {startAdornment}
        </span>
      ) : null}
      <input
        ref={ref}
        className="ex2-input"
        disabled={disabled}
        aria-invalid={invalid || undefined}
        {...rest}
      />
      {endAdornment ? (
        <span className="ex2-input__adornment ex2-input__adornment--end">
          {endAdornment}
        </span>
      ) : null}
    </div>
  );
});

/*
  AmountInput: a thin, opinionated wrapper for price/quantity entry.
  It only constrains input FORMAT (numeric, optional decimals) - it
  never computes fees, totals, or validates against a real balance.
  That logic belongs to the calling trading/wallet page, which has
  the real backend-derived precision/min/max/balance rules.
*/
export const AmountInput = forwardRef(function AmountInput(
  { suffix, decimals, className = "", onChange, ...rest },
  ref
) {
  const handleChange = (event) => {
    const raw = event.target.value;
    const pattern =
      decimals === 0
        ? /^\d*$/
        : new RegExp(`^\\d*(\\.\\d{0,${decimals ?? 18}})?$`);

    if (raw === "" || pattern.test(raw)) {
      onChange?.(event);
    }
  };

  return (
    <Input
      ref={ref}
      inputMode="decimal"
      autoComplete="off"
      className={`ex2-nums ${className}`.trim()}
      endAdornment={suffix}
      onChange={handleChange}
      {...rest}
    />
  );
});

export default Input;
