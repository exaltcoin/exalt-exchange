import "./Button.css";

const VARIANTS = [
  "primary",
  "buy",
  "sell",
  "danger",
  "outline",
  "ghost",
];

const SIZES = ["sm", "md", "lg"];

/*
  Financial-safety note: this component never decides on its own
  whether an action "succeeded" - it only reflects the `loading`/
  `disabled` props the caller passes in, which should always be
  driven by real request state (see the redesign safety rules:
  loading/error/empty states must reflect actual request state).
*/
export const Button = ({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  type = "button",
  className = "",
  children,
  ...rest
}) => {
  const safeVariant = VARIANTS.includes(variant)
    ? variant
    : "primary";
  const safeSize = SIZES.includes(size) ? size : "md";

  const classes = [
    "ex2-btn",
    `ex2-btn--${safeVariant}`,
    `ex2-btn--${safeSize}`,
    fullWidth ? "ex2-btn--full" : "",
    loading ? "ex2-btn--loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <span className="ex2-btn__spinner" aria-hidden="true" />
      ) : null}
      <span className="ex2-btn__label">{children}</span>
    </button>
  );
};

export default Button;
