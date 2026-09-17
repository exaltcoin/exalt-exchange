import { useId, useState } from "react";
import "./Tooltip.css";

export const Tooltip = ({ content, children, placement = "top" }) => {
  const [visible, setVisible] = useState(false);
  const tooltipId = useId();

  if (!content) return children;

  return (
    <span
      className="ex2-tooltip-wrap"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {typeof children === "function"
        ? children({ "aria-describedby": tooltipId })
        : children}
      {visible ? (
        <span
          role="tooltip"
          id={tooltipId}
          className={`ex2-tooltip ex2-tooltip--${placement}`}
        >
          {content}
        </span>
      ) : null}
    </span>
  );
};

export default Tooltip;
