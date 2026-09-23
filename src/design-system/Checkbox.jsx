import { forwardRef } from "react";
import "./Checkbox.css";

export const Checkbox = forwardRef(function Checkbox(
  { label, disabled = false, className = "", id, ...rest },
  ref
) {
  return (
    <label
      className={`ex2-checkbox ${disabled ? "ex2-checkbox--disabled" : ""} ${className}`.trim()}
      htmlFor={id}
    >
      <input
        ref={ref}
        type="checkbox"
        id={id}
        className="ex2-checkbox__input"
        disabled={disabled}
        {...rest}
      />
      <span className="ex2-checkbox__box" aria-hidden="true" />
      {label ? <span className="ex2-checkbox__label">{label}</span> : null}
    </label>
  );
});

/*
  Switch: same semantics as Checkbox (a real, native checkbox
  underneath - not a custom widget reinventing keyboard/aria
  handling), styled to look like a toggle. Use for settings that
  are genuinely binary on/off, e.g. "email notifications enabled".
*/
export const Switch = forwardRef(function Switch(
  { label, disabled = false, className = "", id, ...rest },
  ref
) {
  return (
    <label
      className={`ex2-switch ${disabled ? "ex2-switch--disabled" : ""} ${className}`.trim()}
      htmlFor={id}
    >
      <input
        ref={ref}
        type="checkbox"
        role="switch"
        id={id}
        className="ex2-switch__input"
        disabled={disabled}
        {...rest}
      />
      <span className="ex2-switch__track" aria-hidden="true">
        <span className="ex2-switch__thumb" />
      </span>
      {label ? <span className="ex2-switch__label">{label}</span> : null}
    </label>
  );
});

export default Checkbox;
