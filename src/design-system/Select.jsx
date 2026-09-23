import { forwardRef } from "react";
import "./Select.css";

export const Select = forwardRef(function Select(
  { invalid = false, disabled = false, size = "md", className = "", children, ...rest },
  ref
) {
  const classes = [
    "ex2-select-wrap",
    `ex2-select-wrap--${size}`,
    invalid ? "ex2-select-wrap--invalid" : "",
    disabled ? "ex2-select-wrap--disabled" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <select
        ref={ref}
        className="ex2-select"
        disabled={disabled}
        aria-invalid={invalid || undefined}
        {...rest}
      >
        {children}
      </select>
      <span className="ex2-select__chevron" aria-hidden="true">
        ▾
      </span>
    </div>
  );
});

export default Select;
