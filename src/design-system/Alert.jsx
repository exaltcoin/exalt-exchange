import "./Alert.css";

const TONES = ["info", "success", "warning", "danger"];

export const Alert = ({
  tone = "info",
  title,
  children,
  className = "",
  ...rest
}) => {
  const safeTone = TONES.includes(tone) ? tone : "info";
  const role = safeTone === "danger" || safeTone === "warning"
    ? "alert"
    : "status";

  return (
    <div
      className={`ex2-alert ex2-alert--${safeTone} ${className}`.trim()}
      role={role}
      {...rest}
    >
      {title ? <div className="ex2-alert__title">{title}</div> : null}
      <div className="ex2-alert__body">{children}</div>
    </div>
  );
};

export default Alert;
