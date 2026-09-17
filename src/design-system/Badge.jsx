import "./Badge.css";

const TONES = [
  "neutral",
  "success",
  "warning",
  "danger",
  "info",
  "buy",
  "sell",
];

/*
  Financial-safety note: `tone` and `children` must be derived from
  real backend status values by the caller (e.g. mapping
  order.status === "FILLED" -> tone="success"). This component has
  no default/fallback status text of its own - it never invents a
  status.
*/
export const Badge = ({
  tone = "neutral",
  dot = false,
  className = "",
  children,
  ...rest
}) => {
  const safeTone = TONES.includes(tone) ? tone : "neutral";

  return (
    <span
      className={`ex2-badge ex2-badge--${safeTone} ${className}`.trim()}
      {...rest}
    >
      {dot ? (
        <span className="ex2-badge__dot" aria-hidden="true" />
      ) : null}
      {children}
    </span>
  );
};

export default Badge;
