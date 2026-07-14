import { useEffect, useMemo, useState } from "react";
import { useI18n } from "../i18n";
import "./OwnerControl.css";

const API_FALLBACK =
  "https://exalt-real-backend-6b6v.onrender.com";

const SERVICE_FIELDS = [
  {
    key: "exchangeEnabled",
    label: "Exchange",
    description: "Master switch for the complete exchange.",
  },
  {
    key: "spotTradingEnabled",
    label: "Spot Trading",
    description: "Enable or disable centralized spot trading.",
  },
  {
    key: "futuresTradingEnabled",
    label: "Futures Trading",
    description: "Enable or disable futures trading.",
  },
  {
    key: "depositsEnabled",
    label: "Deposits",
    description: "Allow users to submit deposit requests.",
  },
  {
    key: "withdrawalsEnabled",
    label: "Withdrawals",
    description: "Allow users to submit withdrawal requests.",
  },
  {
    key: "p2pEnabled",
    label: "P2P Trading",
    description: "Enable or disable P2P trading services.",
  },
  {
    key: "stakingEnabled",
    label: "Staking",
    description: "Enable or disable staking services.",
  },
  {
    key: "launchpadEnabled",
    label: "Launchpad",
    description: "Enable or disable launchpad services.",
  },
  {
    key: "aiPremiumEnabled",
    label: "Premium Services",
    description: "Enable or disable premium exchange services.",
  },
  {
    key: "internalLiquidityEnabled",
    label: "Internal Liquidity",
    description: "Enable or disable internal EXALT liquidity.",
  },
  {
    key: "externalLiquidityFallbackEnabled",
    label: "External Liquidity Fallback",
    description: "Enable or disable external liquidity fallback.",
  },
];

const DEFAULT_SERVICES = {
  exchangeEnabled: true,
  spotTradingEnabled: true,
  futuresTradingEnabled: true,
  depositsEnabled: true,
  withdrawalsEnabled: true,
  p2pEnabled: true,
  stakingEnabled: true,
  launchpadEnabled: true,
  aiPremiumEnabled: true,
  internalLiquidityEnabled: false,
  externalLiquidityFallbackEnabled: false,
};

const DEFAULT_FEES = {
  spotMakerFee: {
    enabled: true,
    rateBps: 10,
    minimumFee: 0,
    maximumFee: 0,
    feeCoin: "",
  },
  spotTakerFee: {
    enabled: true,
    rateBps: 10,
    minimumFee: 0,
    maximumFee: 0,
    feeCoin: "",
  },
  exaltBuyFee: {
    enabled: true,
    rateBps: 20,
    minimumFee: 0,
    maximumFee: 0,
    feeCoin: "EXALT",
  },
  exaltSellFee: {
    enabled: true,
    rateBps: 20,
    minimumFee: 0,
    maximumFee: 0,
    feeCoin: "USDT",
  },
  futuresOpenFee: {
    enabled: true,
    rateBps: 5,
    minimumFee: 0,
    maximumFee: 0,
    feeCoin: "USDT",
  },
  futuresCloseFee: {
    enabled: true,
    rateBps: 5,
    minimumFee: 0,
    maximumFee: 0,
    feeCoin: "USDT",
  },
};

const DEFAULT_DISCOUNTS = {
  exaltDiscountEnabled: true,
  exaltDiscountTiers: {
    standard: {
      enabled: true,
      minimumExaltHolding: 10000,
      discountBps: 1000,
    },
    vip1: {
      enabled: true,
      minimumExaltHolding: 100000,
      discountBps: 2000,
    },
    vip2: {
      enabled: true,
      minimumExaltHolding: 1000000,
      discountBps: 3000,
    },
    vip3: {
      enabled: true,
      minimumExaltHolding: 5000000,
      discountBps: 5000,
    },
  },
  vipPlans: {
    vip1: {
      enabled: true,
      monthlyPrice: 19,
      paymentCoin: "USDT",
      makerFeeDiscountBps: 1000,
      takerFeeDiscountBps: 1000,
      futuresFeeDiscountBps: 500,
      withdrawalFeeDiscountBps: 500,
    },
    vip2: {
      enabled: true,
      monthlyPrice: 49,
      paymentCoin: "USDT",
      makerFeeDiscountBps: 2500,
      takerFeeDiscountBps: 2500,
      futuresFeeDiscountBps: 1500,
      withdrawalFeeDiscountBps: 1500,
    },
    vip3: {
      enabled: true,
      monthlyPrice: 99,
      paymentCoin: "USDT",
      makerFeeDiscountBps: 5000,
      takerFeeDiscountBps: 5000,
      futuresFeeDiscountBps: 3000,
      withdrawalFeeDiscountBps: 3000,
    },
  },
};

const DEFAULT_LIQUIDITY = {
  internalLiquidityEnabled: false,
  externalLiquidityFallbackEnabled: false,
  liquiditySettings: {
    defaultPair: "EXALT/USDT",
    maximumSlippageBps: 300,
    maximumPriceImpactBps: 500,
    maximumSingleTradeUSDT: 1000,
    maximumDailyVolumeUSDT: 10000,
    minimumExaltReserve: 0,
    minimumUsdtReserve: 0,
    externalProvider: "none",
  },
};

const TABS = [
  ["overview", "Overview", "📊"],
  ["services", "Exchange Controls", "🏦"],
  ["fees", "Fee Management", "💰"],
  ["discounts", "VIP & EXALT", "⭐"],
  ["liquidity", "Liquidity", "🌊"],
  ["revenue", "Revenue", "📈"],
  ["security", "Security", "🔐"],
];

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

function OwnerControl({ setPage }) {
  const { t } = useI18n();

  const API_BASE =
    import.meta.env.VITE_API_URL || API_FALLBACK;

  const API = API_BASE.endsWith("/api")
    ? API_BASE.replace("/api", "")
    : API_BASE;

  const [activeTab, setActiveTab] = useState("overview");
  const [currentUser, setCurrentUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [settings, setSettings] = useState(null);
  const [services, setServices] = useState(DEFAULT_SERVICES);
  const [fees, setFees] = useState(DEFAULT_FEES);
  const [discounts, setDiscounts] = useState(DEFAULT_DISCOUNTS);
  const [liquidity, setLiquidity] = useState(DEFAULT_LIQUIDITY);

  const [emergencyReason, setEmergencyReason] = useState("");
  const [revenueData, setRevenueData] = useState({
    accounts: [],
    totals: {},
    recentTransactions: [],
  });

  const isOwner =
    currentUser?.role === "owner" &&
    currentUser?.isOwner === true;

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  const translate = (key, fallback) => {
    try {
      const value = t(key, {
        defaultValue: fallback,
        ns: "settings",
      });

      return value && value !== key
        ? value
        : fallback;
    } catch {
      return fallback;
    }
  };

  const showSuccess = (text) => {
    setErrorMessage("");
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 4000);
  };

  const showError = (text) => {
    setMessage("");
    setErrorMessage(text);

    window.setTimeout(() => {
      setErrorMessage("");
    }, 5000);
  };

  const fetchJson = async (
    url,
    options = {}
  ) => {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.success === false) {
      throw new Error(
        data?.message ||
          `Request failed with status ${response.status}`
      );
    }

    return data;
  };

  const loadSettings = async () => {
    if (!token || !isOwner) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const data = await fetchJson(
        `${API}/api/exchange-settings/admin`,
        {
          headers: authHeaders,
        }
      );

      const nextSettings =
        data?.data || data?.settings || {};

      setSettings(nextSettings);

      setServices({
        exchangeEnabled:
          nextSettings.exchangeEnabled ?? true,
        spotTradingEnabled:
          nextSettings.spotTradingEnabled ?? true,
        futuresTradingEnabled:
          nextSettings.futuresTradingEnabled ?? true,
        depositsEnabled:
          nextSettings.depositsEnabled ?? true,
        withdrawalsEnabled:
          nextSettings.withdrawalsEnabled ?? true,
        p2pEnabled:
          nextSettings.p2pEnabled ?? true,
        stakingEnabled:
          nextSettings.stakingEnabled ?? true,
        launchpadEnabled:
          nextSettings.launchpadEnabled ?? true,
        aiPremiumEnabled:
          nextSettings.aiPremiumEnabled ?? true,
        internalLiquidityEnabled:
          nextSettings.internalLiquidityEnabled ?? false,
        externalLiquidityFallbackEnabled:
          nextSettings.externalLiquidityFallbackEnabled ??
          false,
      });

      setFees((previous) => ({
        ...previous,
        spotMakerFee:
          nextSettings.spotMakerFee ||
          previous.spotMakerFee,
        spotTakerFee:
          nextSettings.spotTakerFee ||
          previous.spotTakerFee,
        exaltBuyFee:
          nextSettings.exaltBuyFee ||
          previous.exaltBuyFee,
        exaltSellFee:
          nextSettings.exaltSellFee ||
          previous.exaltSellFee,
        futuresOpenFee:
          nextSettings.futuresOpenFee ||
          previous.futuresOpenFee,
        futuresCloseFee:
          nextSettings.futuresCloseFee ||
          previous.futuresCloseFee,
      }));

      setDiscounts({
        exaltDiscountEnabled:
          nextSettings.exaltDiscountEnabled ?? true,
        exaltDiscountTiers:
          nextSettings.exaltDiscountTiers ||
          DEFAULT_DISCOUNTS.exaltDiscountTiers,
        vipPlans:
          nextSettings.vipPlans ||
          DEFAULT_DISCOUNTS.vipPlans,
      });

      setLiquidity({
        internalLiquidityEnabled:
          nextSettings.internalLiquidityEnabled ?? false,
        externalLiquidityFallbackEnabled:
          nextSettings.externalLiquidityFallbackEnabled ??
          false,
        liquiditySettings:
          nextSettings.liquiditySettings ||
          DEFAULT_LIQUIDITY.liquiditySettings,
      });

      setEmergencyReason(
        nextSettings.emergencyReason || ""
      );
    } catch (error) {
      console.error(
        "Owner settings load failed:",
        error
      );

      showError(
        error.message ||
          "Failed to load owner settings."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadRevenue = async () => {
    if (!token || !isOwner) return;

    try {
      const data = await fetchJson(
        `${API}/api/admin/revenue/dashboard`,
        {
          headers: authHeaders,
        }
      );

      const revenue =
        data?.data || data?.dashboard || data || {};

      setRevenueData({
        accounts:
          revenue.accounts ||
          revenue.revenueAccounts ||
          [],
        totals:
          revenue.totals ||
          revenue.summary ||
          {},
        recentTransactions:
          revenue.recentFeeTransactions ||
          revenue.recentTransactions ||
          [],
      });
    } catch (error) {
      console.error(
        "Revenue dashboard load failed:",
        error
      );
    }
  };

  useEffect(() => {
    setCurrentUser(readStoredUser());
    loadSettings();
    loadRevenue();
  }, []);

  const updateService = (
    field,
    value
  ) => {
    setServices((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const saveServices = async () => {
    try {
      setSaving("services");

      const data = await fetchJson(
        `${API}/api/exchange-settings/admin/services`,
        {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({
            ...services,
            changeNote:
              "Owner updated exchange service controls",
          }),
        }
      );

      if (data?.data) {
        setServices((previous) => ({
          ...previous,
          ...data.data,
        }));
      }

      await loadSettings();
      showSuccess(
        "Exchange service controls updated successfully."
      );
    } catch (error) {
      showError(error.message);
    } finally {
      setSaving("");
    }
  };

  const saveFees = async () => {
    try {
      setSaving("fees");

      await fetchJson(
        `${API}/api/exchange-settings/admin/fees`,
        {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({
            ...fees,
            changeNote:
              "Owner updated exchange fee settings",
          }),
        }
      );

      await loadSettings();
      showSuccess(
        "Fee settings updated successfully."
      );
    } catch (error) {
      showError(error.message);
    } finally {
      setSaving("");
    }
  };

  const saveDiscounts = async () => {
    try {
      setSaving("discounts");

      await fetchJson(
        `${API}/api/exchange-settings/admin/discounts`,
        {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({
            ...discounts,
            changeNote:
              "Owner updated VIP and EXALT discounts",
          }),
        }
      );

      await loadSettings();
      showSuccess(
        "VIP and EXALT discount settings updated."
      );
    } catch (error) {
      showError(error.message);
    } finally {
      setSaving("");
    }
  };

  const saveLiquiditySettings = async () => {
    try {
      setSaving("liquidity");

      await fetchJson(
        `${API}/api/exchange-settings/admin/liquidity`,
        {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({
            ...liquidity,
            changeNote:
              "Owner updated liquidity controls",
          }),
        }
      );

      await loadSettings();
      showSuccess(
        "Liquidity controls updated successfully."
      );
    } catch (error) {
      showError(error.message);
    } finally {
      setSaving("");
    }
  };

  const pauseExchange = async () => {
    const reason =
      emergencyReason.trim() ||
      "Trading paused by Exchange Owner";

    const confirmed = window.confirm(
      "Are you sure you want to activate emergency trading pause?"
    );

    if (!confirmed) return;

    try {
      setSaving("pause");

      await fetchJson(
        `${API}/api/exchange-settings/admin/emergency/pause`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            reason,
            changeNote:
              "Owner activated emergency trading pause",
          }),
        }
      );

      await loadSettings();
      showSuccess(
        "Emergency trading pause activated."
      );
    } catch (error) {
      showError(error.message);
    } finally {
      setSaving("");
    }
  };

  const resumeExchange = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to resume exchange trading?"
    );

    if (!confirmed) return;

    try {
      setSaving("resume");

      await fetchJson(
        `${API}/api/exchange-settings/admin/emergency/resume`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            changeNote:
              "Owner resumed exchange trading",
          }),
        }
      );

      await loadSettings();
      showSuccess(
        "Exchange trading resumed successfully."
      );
    } catch (error) {
      showError(error.message);
    } finally {
      setSaving("");
    }
  };

  const updateFeeField = (
    feeName,
    field,
    value
  ) => {
    setFees((previous) => ({
      ...previous,
      [feeName]: {
        ...previous[feeName],
        [field]:
          field === "enabled"
            ? Boolean(value)
            : field === "feeCoin"
            ? value
            : Number(value || 0),
      },
    }));
  };

  const updateDiscountTier = (
    tierName,
    field,
    value
  ) => {
    setDiscounts((previous) => ({
      ...previous,
      exaltDiscountTiers: {
        ...previous.exaltDiscountTiers,
        [tierName]: {
          ...previous.exaltDiscountTiers[tierName],
          [field]:
            field === "enabled"
              ? Boolean(value)
              : Number(value || 0),
        },
      },
    }));
  };

  const updateVipPlan = (
    planName,
    field,
    value
  ) => {
    setDiscounts((previous) => ({
      ...previous,
      vipPlans: {
        ...previous.vipPlans,
        [planName]: {
          ...previous.vipPlans[planName],
          [field]:
            field === "enabled"
              ? Boolean(value)
              : field === "paymentCoin"
              ? value
              : Number(value || 0),
        },
      },
    }));
  };

  const updateLiquidityField = (
    field,
    value
  ) => {
    setLiquidity((previous) => ({
      ...previous,
      liquiditySettings: {
        ...previous.liquiditySettings,
        [field]:
          field === "defaultPair" ||
          field === "externalProvider"
            ? value
            : Number(value || 0),
      },
    }));
  };

  const formatMoney = (
    value,
    currency = "USDT"
  ) => {
    const number = Number(value || 0);

    return `${number.toLocaleString(undefined, {
      maximumFractionDigits: 6,
    })} ${currency}`;
  };

  const serviceEnabledCount =
    Object.values(services).filter(Boolean).length;

  const serviceDisabledCount =
    Object.values(services).filter(
      (value) => !value
    ).length;

  const emergencyActive =
    Boolean(settings?.emergencyTradingPause);

  if (!isOwner) {
    return (
      <div className="owner-control-page">
        <div className="owner-access-card">
          <div className="owner-access-icon">🔒</div>

          <h1>
            {translate(
              "ownerAccessRequired",
              "Owner Access Required"
            )}
          </h1>

          <p>
            This control center is restricted to the verified
            Exalt Exchange Owner.
          </p>

          <button
            type="button"
            onClick={() =>
              setPage && setPage("dashboard")
            }
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="owner-control-page">
        <div className="owner-loading-card">
          <div className="owner-loader" />
          <h2>Loading Owner Control Center</h2>
          <p>
            Securely loading exchange settings and
            financial controls.
          </p>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <>
      <div className="owner-hero">
        <div>
          <span className="owner-eyebrow">
            VERIFIED EXCHANGE OWNER
          </span>

          <h1>Exalt Exchange Owner Control</h1>

          <p>
            Strategic, financial and emergency control for
            the complete Exalt Exchange ecosystem.
          </p>
        </div>

        <div
          className={`owner-system-status ${
            emergencyActive
              ? "danger"
              : services.exchangeEnabled
              ? "active"
              : "offline"
          }`}
        >
          <span />

          {emergencyActive
            ? "Emergency Pause Active"
            : services.exchangeEnabled
            ? "Exchange Operational"
            : "Exchange Disabled"}
        </div>
      </div>

      <div className="owner-stat-grid">
        <div className="owner-stat-card">
          <span>Enabled Services</span>
          <strong>{serviceEnabledCount}</strong>
          <p>Currently available exchange modules.</p>
        </div>

        <div className="owner-stat-card">
          <span>Disabled Services</span>
          <strong>{serviceDisabledCount}</strong>
          <p>Modules currently restricted by owner.</p>
        </div>

        <div className="owner-stat-card">
          <span>Emergency Status</span>
          <strong>
            {emergencyActive ? "PAUSED" : "NORMAL"}
          </strong>
          <p>
            {emergencyActive
              ? settings?.emergencyReason ||
                "Emergency pause is active."
              : "No emergency restriction is active."}
          </p>
        </div>

        <div className="owner-stat-card">
          <span>Internal Liquidity</span>
          <strong>
            {services.internalLiquidityEnabled
              ? "ENABLED"
              : "DISABLED"}
          </strong>
          <p>
            EXALT internal trading pool status.
          </p>
        </div>
      </div>

      <div className="owner-dashboard-grid">
        <div className="owner-panel">
          <div className="owner-panel-head">
            <div>
              <h2>Critical System Controls</h2>
              <p>
                Access the most sensitive exchange
                settings.
              </p>
            </div>
          </div>

          <div className="owner-quick-grid">
            <button
              type="button"
              onClick={() => setActiveTab("services")}
            >
              <span>🏦</span>
              Exchange Controls
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("fees")}
            >
              <span>💰</span>
              Fee Management
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveTab("liquidity")
              }
            >
              <span>🌊</span>
              Liquidity Control
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("revenue")}
            >
              <span>📈</span>
              Revenue Dashboard
            </button>
          </div>
        </div>

        <div className="owner-panel">
          <div className="owner-panel-head">
            <div>
              <h2>Owner Security</h2>
              <p>
                Protected owner account and control
                status.
              </p>
            </div>
          </div>

          <div className="owner-security-list">
            <div>
              <span>Owner Role</span>
              <strong>Verified</strong>
            </div>

            <div>
              <span>Owner Account</span>
              <strong>
                {currentUser?.email || "Owner"}
              </strong>
            </div>

            <div>
              <span>Two-Factor Requirement</span>
              <strong>Required</strong>
            </div>

            <div>
              <span>Financial Controls</span>
              <strong>Owner Only</strong>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderServices = () => (
    <div className="owner-panel">
      <div className="owner-panel-head">
        <div>
          <h2>Exchange Master Controls</h2>
          <p>
            Enable or disable critical exchange modules.
          </p>
        </div>

        <button
          type="button"
          className="owner-primary-btn"
          disabled={saving === "services"}
          onClick={saveServices}
        >
          {saving === "services"
            ? "Saving..."
            : "Save Controls"}
        </button>
      </div>

      <div className="owner-service-grid">
        {SERVICE_FIELDS.map((service) => (
          <div
            className="owner-service-card"
            key={service.key}
          >
            <div>
              <h3>{service.label}</h3>
              <p>{service.description}</p>
            </div>

            <label className="owner-switch">
              <input
                type="checkbox"
                checked={Boolean(
                  services[service.key]
                )}
                onChange={(event) =>
                  updateService(
                    service.key,
                    event.target.checked
                  )
                }
              />

              <span />
            </label>
          </div>
        ))}
      </div>

      <div className="owner-emergency-box">
        <div>
          <h2>Emergency Trading Control</h2>
          <p>
            Immediately pause all exchange trading and
            protected financial services.
          </p>
        </div>

        <textarea
          placeholder="Emergency pause reason..."
          value={emergencyReason}
          onChange={(event) =>
            setEmergencyReason(event.target.value)
          }
        />

        <div className="owner-emergency-actions">
          <button
            type="button"
            className="owner-danger-btn"
            disabled={
              saving === "pause" ||
              emergencyActive
            }
            onClick={pauseExchange}
          >
            {saving === "pause"
              ? "Activating..."
              : "Activate Emergency Pause"}
          </button>

          <button
            type="button"
            className="owner-success-btn"
            disabled={
              saving === "resume" ||
              !emergencyActive
            }
            onClick={resumeExchange}
          >
            {saving === "resume"
              ? "Resuming..."
              : "Resume Exchange"}
          </button>
        </div>
      </div>
    </div>
  );

  const renderFeeCard = (
    feeName,
    title
  ) => {
    const fee = fees[feeName];

    return (
      <div
        className="owner-fee-card"
        key={feeName}
      >
        <div className="owner-fee-head">
          <h3>{title}</h3>

          <label className="owner-switch">
            <input
              type="checkbox"
              checked={Boolean(fee.enabled)}
              onChange={(event) =>
                updateFeeField(
                  feeName,
                  "enabled",
                  event.target.checked
                )
              }
            />
            <span />
          </label>
        </div>

        <label>
          Rate (Basis Points)
          <input
            type="number"
            value={fee.rateBps}
            onChange={(event) =>
              updateFeeField(
                feeName,
                "rateBps",
                event.target.value
              )
            }
          />
        </label>

        <label>
          Minimum Fee
          <input
            type="number"
            value={fee.minimumFee}
            onChange={(event) =>
              updateFeeField(
                feeName,
                "minimumFee",
                event.target.value
              )
            }
          />
        </label>

        <label>
          Maximum Fee
          <input
            type="number"
            value={fee.maximumFee}
            onChange={(event) =>
              updateFeeField(
                feeName,
                "maximumFee",
                event.target.value
              )
            }
          />
        </label>

        <label>
          Fee Coin
          <select
            value={fee.feeCoin || ""}
            onChange={(event) =>
              updateFeeField(
                feeName,
                "feeCoin",
                event.target.value
              )
            }
          >
            <option value="">Automatic</option>
            <option value="USDT">USDT</option>
            <option value="BNB">BNB</option>
            <option value="EXALT">EXALT</option>
          </select>
        </label>

        <small>
          {fee.rateBps} bps ={" "}
          {(
            Number(fee.rateBps || 0) / 100
          ).toFixed(2)}
          %
        </small>
      </div>
    );
  };

  const renderFees = () => (
    <div className="owner-panel">
      <div className="owner-panel-head">
        <div>
          <h2>Exchange Fee Management</h2>
          <p>
            Configure trading and liquidity fee settings.
          </p>
        </div>

        <button
          type="button"
          className="owner-primary-btn"
          disabled={saving === "fees"}
          onClick={saveFees}
        >
          {saving === "fees"
            ? "Saving..."
            : "Save Fee Settings"}
        </button>
      </div>

      <div className="owner-fee-grid">
        {renderFeeCard(
          "spotMakerFee",
          "Spot Maker Fee"
        )}

        {renderFeeCard(
          "spotTakerFee",
          "Spot Taker Fee"
        )}

        {renderFeeCard(
          "exaltBuyFee",
          "EXALT Buy Fee"
        )}

        {renderFeeCard(
          "exaltSellFee",
          "EXALT Sell Fee"
        )}

        {renderFeeCard(
          "futuresOpenFee",
          "Futures Open Fee"
        )}

        {renderFeeCard(
          "futuresCloseFee",
          "Futures Close Fee"
        )}
      </div>
    </div>
  );

  const renderDiscounts = () => (
    <div className="owner-panel">
      <div className="owner-panel-head">
        <div>
          <h2>VIP and EXALT Discounts</h2>
          <p>
            Configure holding-based and membership-based
            fee discounts.
          </p>
        </div>

        <button
          type="button"
          className="owner-primary-btn"
          disabled={saving === "discounts"}
          onClick={saveDiscounts}
        >
          {saving === "discounts"
            ? "Saving..."
            : "Save Discounts"}
        </button>
      </div>

      <div className="owner-master-toggle">
        <div>
          <h3>EXALT Holding Discounts</h3>
          <p>
            Reward users who hold EXALT in their exchange
            wallet.
          </p>
        </div>

        <label className="owner-switch">
          <input
            type="checkbox"
            checked={Boolean(
              discounts.exaltDiscountEnabled
            )}
            onChange={(event) =>
              setDiscounts((previous) => ({
                ...previous,
                exaltDiscountEnabled:
                  event.target.checked,
              }))
            }
          />

          <span />
        </label>
      </div>

      <h3 className="owner-section-title">
        EXALT Holding Tiers
      </h3>

      <div className="owner-tier-grid">
        {Object.entries(
          discounts.exaltDiscountTiers || {}
        ).map(([tierName, tier]) => (
          <div
            className="owner-tier-card"
            key={tierName}
          >
            <div className="owner-fee-head">
              <h3>{tierName.toUpperCase()}</h3>

              <label className="owner-switch">
                <input
                  type="checkbox"
                  checked={Boolean(tier.enabled)}
                  onChange={(event) =>
                    updateDiscountTier(
                      tierName,
                      "enabled",
                      event.target.checked
                    )
                  }
                />

                <span />
              </label>
            </div>

            <label>
              Minimum EXALT Holding
              <input
                type="number"
                value={tier.minimumExaltHolding}
                onChange={(event) =>
                  updateDiscountTier(
                    tierName,
                    "minimumExaltHolding",
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              Discount BPS
              <input
                type="number"
                value={tier.discountBps}
                onChange={(event) =>
                  updateDiscountTier(
                    tierName,
                    "discountBps",
                    event.target.value
                  )
                }
              />
            </label>
          </div>
        ))}
      </div>

      <h3 className="owner-section-title">
        VIP Membership Plans
      </h3>

      <div className="owner-tier-grid">
        {Object.entries(
          discounts.vipPlans || {}
        ).map(([planName, plan]) => (
          <div
            className="owner-tier-card"
            key={planName}
          >
            <div className="owner-fee-head">
              <h3>{planName.toUpperCase()}</h3>

              <label className="owner-switch">
                <input
                  type="checkbox"
                  checked={Boolean(plan.enabled)}
                  onChange={(event) =>
                    updateVipPlan(
                      planName,
                      "enabled",
                      event.target.checked
                    )
                  }
                />

                <span />
              </label>
            </div>

            <label>
              Monthly Price
              <input
                type="number"
                value={plan.monthlyPrice}
                onChange={(event) =>
                  updateVipPlan(
                    planName,
                    "monthlyPrice",
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              Payment Coin
              <select
                value={plan.paymentCoin}
                onChange={(event) =>
                  updateVipPlan(
                    planName,
                    "paymentCoin",
                    event.target.value
                  )
                }
              >
                <option value="USDT">USDT</option>
                <option value="BNB">BNB</option>
                <option value="EXALT">EXALT</option>
              </select>
            </label>

            <label>
              Maker Discount BPS
              <input
                type="number"
                value={
                  plan.makerFeeDiscountBps
                }
                onChange={(event) =>
                  updateVipPlan(
                    planName,
                    "makerFeeDiscountBps",
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              Taker Discount BPS
              <input
                type="number"
                value={
                  plan.takerFeeDiscountBps
                }
                onChange={(event) =>
                  updateVipPlan(
                    planName,
                    "takerFeeDiscountBps",
                    event.target.value
                  )
                }
              />
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLiquidity = () => (
    <div className="owner-panel">
      <div className="owner-panel-head">
        <div>
          <h2>Internal Liquidity Controls</h2>
          <p>
            Configure EXALT internal liquidity safety
            limits and fallback settings.
          </p>
        </div>

        <button
          type="button"
          className="owner-primary-btn"
          disabled={saving === "liquidity"}
          onClick={saveLiquiditySettings}
        >
          {saving === "liquidity"
            ? "Saving..."
            : "Save Liquidity Settings"}
        </button>
      </div>

      <div className="owner-service-grid">
        <div className="owner-service-card">
          <div>
            <h3>Internal Liquidity</h3>
            <p>
              Enable EXALT internal liquidity execution.
            </p>
          </div>

          <label className="owner-switch">
            <input
              type="checkbox"
              checked={Boolean(
                liquidity.internalLiquidityEnabled
              )}
              onChange={(event) =>
                setLiquidity((previous) => ({
                  ...previous,
                  internalLiquidityEnabled:
                    event.target.checked,
                }))
              }
            />

            <span />
          </label>
        </div>

        <div className="owner-service-card">
          <div>
            <h3>External Fallback</h3>
            <p>
              Allow fallback to an external provider.
            </p>
          </div>

          <label className="owner-switch">
            <input
              type="checkbox"
              checked={Boolean(
                liquidity.externalLiquidityFallbackEnabled
              )}
              onChange={(event) =>
                setLiquidity((previous) => ({
                  ...previous,
                  externalLiquidityFallbackEnabled:
                    event.target.checked,
                }))
              }
            />

            <span />
          </label>
        </div>
      </div>

      <div className="owner-form-grid">
        <label>
          Default Pair
          <input
            value={
              liquidity.liquiditySettings.defaultPair
            }
            onChange={(event) =>
              updateLiquidityField(
                "defaultPair",
                event.target.value
              )
            }
          />
        </label>

        <label>
          Maximum Slippage BPS
          <input
            type="number"
            value={
              liquidity.liquiditySettings
                .maximumSlippageBps
            }
            onChange={(event) =>
              updateLiquidityField(
                "maximumSlippageBps",
                event.target.value
              )
            }
          />
        </label>

        <label>
          Maximum Price Impact BPS
          <input
            type="number"
            value={
              liquidity.liquiditySettings
                .maximumPriceImpactBps
            }
            onChange={(event) =>
              updateLiquidityField(
                "maximumPriceImpactBps",
                event.target.value
              )
            }
          />
        </label>

        <label>
          Maximum Single Trade USDT
          <input
            type="number"
            value={
              liquidity.liquiditySettings
                .maximumSingleTradeUSDT
            }
            onChange={(event) =>
              updateLiquidityField(
                "maximumSingleTradeUSDT",
                event.target.value
              )
            }
          />
        </label>

        <label>
          Maximum Daily Volume USDT
          <input
            type="number"
            value={
              liquidity.liquiditySettings
                .maximumDailyVolumeUSDT
            }
            onChange={(event) =>
              updateLiquidityField(
                "maximumDailyVolumeUSDT",
                event.target.value
              )
            }
          />
        </label>

        <label>
          Minimum EXALT Reserve
          <input
            type="number"
            value={
              liquidity.liquiditySettings
                .minimumExaltReserve
            }
            onChange={(event) =>
              updateLiquidityField(
                "minimumExaltReserve",
                event.target.value
              )
            }
          />
        </label>

        <label>
          Minimum USDT Reserve
          <input
            type="number"
            value={
              liquidity.liquiditySettings
                .minimumUsdtReserve
            }
            onChange={(event) =>
              updateLiquidityField(
                "minimumUsdtReserve",
                event.target.value
              )
            }
          />
        </label>

        <label>
          External Provider
          <select
            value={
              liquidity.liquiditySettings
                .externalProvider
            }
            onChange={(event) =>
              updateLiquidityField(
                "externalProvider",
                event.target.value
              )
            }
          >
            <option value="none">None</option>
            <option value="pancakeswap">
              PancakeSwap
            </option>
          </select>
        </label>
      </div>

      <div className="owner-info-box">
        <strong>Financial Movement Protection</strong>
        <p>
          Liquidity deposit, withdrawal and pool pricing
          routes remain protected by Owner-only backend
          middleware.
        </p>
      </div>
    </div>
  );

  const renderRevenue = () => (
    <div className="owner-panel">
      <div className="owner-panel-head">
        <div>
          <h2>Exchange Revenue Overview</h2>
          <p>
            Revenue accounts, balances and recent fee
            activity.
          </p>
        </div>

        <button
          type="button"
          className="owner-primary-btn"
          onClick={loadRevenue}
        >
          Refresh Revenue
        </button>
      </div>

      <div className="owner-stat-grid">
        <div className="owner-stat-card">
          <span>Total Revenue</span>
          <strong>
            {formatMoney(
              revenueData.totals.totalRevenue ||
                revenueData.totals.lifetimeRevenue ||
                0
            )}
          </strong>
          <p>Lifetime exchange revenue.</p>
        </div>

        <div className="owner-stat-card">
          <span>Available Revenue</span>
          <strong>
            {formatMoney(
              revenueData.totals.availableBalance ||
                0
            )}
          </strong>
          <p>Revenue available before withdrawal.</p>
        </div>

        <div className="owner-stat-card">
          <span>Refunded Revenue</span>
          <strong>
            {formatMoney(
              revenueData.totals.refundedRevenue ||
                0
            )}
          </strong>
          <p>Total fees refunded to users.</p>
        </div>

        <div className="owner-stat-card">
          <span>Reversed Revenue</span>
          <strong>
            {formatMoney(
              revenueData.totals.reversedRevenue ||
                0
            )}
          </strong>
          <p>Total revenue reversals.</p>
        </div>
      </div>

      <div className="owner-revenue-grid">
        <div className="owner-revenue-box">
          <h3>Revenue Accounts</h3>

          {revenueData.accounts.length === 0 ? (
            <p>No revenue account data available.</p>
          ) : (
            revenueData.accounts.map(
              (account, index) => (
                <div
                  className="owner-revenue-row"
                  key={
                    account._id ||
                    account.coin ||
                    index
                  }
                >
                  <div>
                    <strong>
                      {account.coin || "USDT"}
                    </strong>
                    <span>
                      {account.isFrozen
                        ? "Frozen"
                        : "Active"}
                    </span>
                  </div>

                  <div>
                    <strong>
                      {formatMoney(
                        account.availableBalance ||
                          account.balance ||
                          0,
                        account.coin || "USDT"
                      )}
                    </strong>

                    <span>
                      {account.withdrawalsEnabled
                        ? "Withdrawals Enabled"
                        : "Withdrawals Disabled"}
                    </span>
                  </div>
                </div>
              )
            )
          )}
        </div>

        <div className="owner-revenue-box">
          <h3>Recent Fee Transactions</h3>

          {revenueData.recentTransactions.length ===
          0 ? (
            <p>No recent fee transactions available.</p>
          ) : (
            revenueData.recentTransactions
              .slice(0, 8)
              .map((transaction, index) => (
                <div
                  className="owner-revenue-row"
                  key={
                    transaction._id ||
                    transaction.id ||
                    index
                  }
                >
                  <div>
                    <strong>
                      {transaction.module ||
                        transaction.feeType ||
                        "FEE"}
                    </strong>

                    <span>
                      {transaction.status ||
                        "SUCCESS"}
                    </span>
                  </div>

                  <div>
                    <strong>
                      {formatMoney(
                        transaction.feeAmount ||
                          transaction.amount ||
                          0,
                        transaction.coin || "USDT"
                      )}
                    </strong>

                    <span>
                      {transaction.createdAt
                        ? new Date(
                            transaction.createdAt
                          ).toLocaleString()
                        : ""}
                    </span>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="owner-panel">
      <div className="owner-panel-head">
        <div>
          <h2>Owner Security Center</h2>
          <p>
            Security status and protected owner
            architecture.
          </p>
        </div>
      </div>

      <div className="owner-security-grid">
        <div className="owner-security-card">
          <span>👑</span>
          <h3>Single Owner Account</h3>
          <p>
            The backend allows only one verified owner
            account.
          </p>
        </div>

        <div className="owner-security-card">
          <span>🔐</span>
          <h3>Owner-Only Routes</h3>
          <p>
            Fees, liquidity, revenue and emergency controls
            are owner protected.
          </p>
        </div>

        <div className="owner-security-card">
          <span>🛡️</span>
          <h3>Session Invalidation</h3>
          <p>
            Role or security changes invalidate active
            sessions.
          </p>
        </div>

        <div className="owner-security-card">
          <span>📜</span>
          <h3>Audit Trail</h3>
          <p>
            Sensitive financial actions are recorded for
            review.
          </p>
        </div>
      </div>
    </div>
  );

  const renderActiveTab = () => {
    if (activeTab === "overview") {
      return renderOverview();
    }

    if (activeTab === "services") {
      return renderServices();
    }

    if (activeTab === "fees") {
      return renderFees();
    }

    if (activeTab === "discounts") {
      return renderDiscounts();
    }

    if (activeTab === "liquidity") {
      return renderLiquidity();
    }

    if (activeTab === "revenue") {
      return renderRevenue();
    }

    if (activeTab === "security") {
      return renderSecurity();
    }

    return renderOverview();
  };

  return (
    <div className="owner-control-page">
      <div className="owner-control-top">
        <div>
          <span>EXALT EXCHANGE</span>
          <h1>Owner Management Center</h1>
        </div>

        <div className="owner-profile-chip">
          <div>👑</div>

          <div>
            <strong>
              {currentUser?.name || "Exchange Owner"}
            </strong>

            <span>
              {currentUser?.email || "Owner Account"}
            </span>
          </div>
        </div>
      </div>

      {message && (
        <div className="owner-alert success">
          {message}
        </div>
      )}

      {errorMessage && (
        <div className="owner-alert error">
          {errorMessage}
        </div>
      )}

      <div className="owner-tabs">
        {TABS.map(([key, label, icon]) => (
          <button
            type="button"
            key={key}
            className={
              activeTab === key ? "active" : ""
            }
            onClick={() => setActiveTab(key)}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {renderActiveTab()}
    </div>
  );
}

export default OwnerControl;