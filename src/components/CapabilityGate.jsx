import { useI18n } from "../i18n/index.js";
import "./CapabilityGate.css";
import { Badge, EmptyState, SkeletonText } from "../design-system/index.js";
import { useModuleCapability } from "../hooks/useCapabilities.js";

/*
  Real-Service Audit: one shared, honest status screen reused by
  every module page, instead of each page inventing its own ad hoc
  unavailable-state wording. Real, backend-derived status only -
  never a hardcoded assumption. `children` (the real module UI) is
  rendered ONLY when the real backend reports LIVE.
*/

const STATUS_TONE = {
  LIVE: "success",
  BETA: "warning",
  COMING_SOON: "neutral",
  PROVIDER_REQUIRED: "warning",
  DISABLED: "neutral",
  MAINTENANCE: "neutral",
};

function CapabilityGate({ moduleKey, children, allowBeta = false }) {
  const { t } = useI18n();
  const { module, loadState } = useModuleCapability(moduleKey);

  const translateWithFallback = (key, fallback, namespace = "common") => {
    try {
      const value = t(key, { ns: namespace, defaultValue: fallback });
      return value === undefined || value === null || value === key
        ? fallback
        : value;
    } catch (error) {
      return fallback;
    }
  };

  if (loadState === "loading") {
    return <SkeletonText lines={3} />;
  }

  if (loadState === "unavailable" || !module) {
    return (
      <EmptyState
        title={translateWithFallback(
          "capabilityStatusUnavailable",
          "Unable to load module status right now."
        )}
        description={translateWithFallback(
          "capabilityStatusRetry",
          "Please check your connection and try again."
        )}
      />
    );
  }

  const isUsable =
    module.status === "LIVE" || (allowBeta && module.status === "BETA");

  if (!isUsable) {
    return (
      <div className="capability-gate-unavailable">
        <Badge tone={STATUS_TONE[module.status] || "neutral"}>
          {module.status}
        </Badge>
        <p className="capability-gate-reason">{module.reason}</p>
      </div>
    );
  }

  return (
    <>
      {module.status === "BETA" ? (
        <div className="capability-gate-beta-banner">
          <Badge tone="warning">{translateWithFallback("beta", "Beta")}</Badge>
          <span>{module.reason}</span>
        </div>
      ) : null}
      {children}
    </>
  );
}

export default CapabilityGate;
