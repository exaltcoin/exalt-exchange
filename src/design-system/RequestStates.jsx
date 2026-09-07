import "./RequestStates.css";
import { Button } from "./Button.jsx";

/*
  These three components exist specifically to satisfy the redesign
  safety rule: "All loading/error/empty states must reflect actual
  request state" and "Feature-flagged/provider-dependent modules
  must remain honestly disabled where appropriate." None of them
  invent copy about *why* something is empty/failed/unavailable -
  the caller must supply that from real state (an empty API result,
  a caught request error, a feature-flag check), never a guess.
*/

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  className = "",
  ...rest
}) => (
  <div
    className={`ex2-request-state ex2-request-state--empty ${className}`.trim()}
    {...rest}
  >
    {icon ? (
      <div className="ex2-request-state__icon" aria-hidden="true">
        {icon}
      </div>
    ) : null}
    {title ? <div className="ex2-request-state__title">{title}</div> : null}
    {description ? (
      <div className="ex2-request-state__description">{description}</div>
    ) : null}
    {action ? <div className="ex2-request-state__action">{action}</div> : null}
  </div>
);

export const ErrorState = ({
  title,
  description,
  onRetry,
  retryLabel = "Retry",
  retrying = false,
  className = "",
  ...rest
}) => (
  <div
    className={`ex2-request-state ex2-request-state--error ${className}`.trim()}
    role="alert"
    {...rest}
  >
    {title ? <div className="ex2-request-state__title">{title}</div> : null}
    {description ? (
      <div className="ex2-request-state__description">{description}</div>
    ) : null}
    {onRetry ? (
      <div className="ex2-request-state__action">
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          loading={retrying}
        >
          {retryLabel}
        </Button>
      </div>
    ) : null}
  </div>
);

export const MaintenanceState = ({
  title,
  description,
  className = "",
  ...rest
}) => (
  <div
    className={`ex2-request-state ex2-request-state--maintenance ${className}`.trim()}
    role="status"
    {...rest}
  >
    <div className="ex2-request-state__badge">Unavailable</div>
    {title ? <div className="ex2-request-state__title">{title}</div> : null}
    {description ? (
      <div className="ex2-request-state__description">{description}</div>
    ) : null}
  </div>
);
