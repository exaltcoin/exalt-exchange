import { useI18n } from "../i18n/index.js";
import "./ServicesHub.css";
import {
  PageContainer,
  Section,
  Grid,
  Badge,
} from "../design-system/index.js";

/*
  Batch 6: the real EXALT Services hub. Every entry below was
  individually verified against the actual current app.jsx routing
  table before being included - no page key was guessed. State is
  capability-driven, not decorative:

  - "active": a real, working feature with a real backend behind it
  - "gated": a real feature that exists but is intentionally
    production-gated (Futures execution) or provider-not-connected
    (TradFi/CFD, Card) - visiting it shows the real honest state,
    it is not a dead link
  - "unavailable": the feature genuinely doesn't execute yet
    (Convert - confirmed zero pairs are executable, Batch 3)

  No entry here was invented to fill out the grid - Security was
  deliberately left out rather than pointed at a page that doesn't
  represent it, since no dedicated Security page exists anywhere in
  the current routing table (confirmed by search) - 2FA/session
  management live under Settings today.
*/

const SERVICE_ENTRIES = [
  { key: "dashboard", icon: "\ud83c\udfe0", state: "active" },
  { key: "wallets", icon: "\ud83d\udcb0", state: "active", labelKey: "deposit" },
  { key: "wallets", icon: "\ud83d\udcb8", state: "active", labelKey: "withdraw" },
  { key: "trade", icon: "\ud83d\udcc8", state: "active", labelKey: "spot" },
  { key: "futures", icon: "\ud83d\udcc9", state: "gated", labelKey: "futures" },
  { key: "tradfi", icon: "\ud83d\udcca", state: "gated", labelKey: "tradFi" },
  { key: "assets", icon: "\ud83d\udcbc", state: "active", labelKey: "assets" },
  { key: "p2p", icon: "\ud83c\udf10", state: "active", labelKey: "p2p" },
  { key: "staking", icon: "\ud83d\udd12", state: "active", labelKey: "earn" },
  { key: "referral", icon: "\ud83e\udd1d", state: "active", labelKey: "referralProgram" },
  { key: "rewards", icon: "\ud83c\udfc6", state: "active", labelKey: "rewardsCenter" },
  { key: "web3wallet", icon: "\u26d3\ufe0f", state: "active", labelKey: "web3Wallet" },
  { key: "notification-center", icon: "\ud83d\udd14", state: "active", labelKey: "notificationCenter" },
  { key: "exalt-card", icon: "\ud83d\udcb3", state: "gated", labelKey: "exaltCard" },
  { key: "kyc-submit", icon: "\ud83e\udeaa", state: "active", labelKey: "kyc" },
  { key: "settings", icon: "\u2699\ufe0f", state: "active", labelKey: "settings" },
  { key: "support", icon: "\ud83c\udfa7", state: "active", labelKey: "support" },
];

const STATE_TONE = {
  active: "success",
  gated: "warning",
  unavailable: "neutral",
};

function ServicesHub({ setPage }) {
  const { t } = useI18n();

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

  return (
    <PageContainer maxWidth="900px">
      <Section
        title={translateWithFallback("servicesHub", "Services")}
      >
        <Grid minItemWidth="140px" gap="4">
          {SERVICE_ENTRIES.map((entry, index) => (
            <button
              key={`${entry.key}-${entry.labelKey || index}`}
              type="button"
              className="services-hub-item"
              onClick={() => setPage(entry.key)}
              aria-label={translateWithFallback(
                entry.labelKey || entry.key,
                entry.key
              )}
            >
              <span className="services-hub-item__icon" aria-hidden="true">
                {entry.icon}
              </span>
              <span className="services-hub-item__label">
                {translateWithFallback(entry.labelKey || entry.key, entry.key)}
              </span>
              {entry.state !== "active" ? (
                <Badge tone={STATE_TONE[entry.state]}>
                  {entry.state === "gated"
                    ? translateWithFallback("gated", "Limited", "common")
                    : translateWithFallback(
                        "unavailable",
                        "Unavailable",
                        "staking"
                      )}
                </Badge>
              ) : null}
            </button>
          ))}
        </Grid>

        {/*
          Convert is deliberately absent from this grid entirely,
          not shown as a disabled tile - confirmed zero executable
          pairs exist anywhere (Batch 3), and there is no page for
          it to link to. A disabled tile pointing nowhere would be
          its own small dishonesty.
        */}
      </Section>
    </PageContainer>
  );
}

export default ServicesHub;
