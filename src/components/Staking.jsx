import "./Staking.css";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useI18n } from "../i18n";
import { apiFetch } from "../lib/apiClient.js";
import CapabilityGate from "./CapabilityGate.jsx";
import EarnedExaltPanel from "../features/earnedExalt/EarnedExaltPanel.jsx";
import "../design-system/Tabs.css";

/*
  Batch 6 audit findings, all fixed in this rewrite:

  1. The stake-creation call hardcoded coin: "EXALT" and
     durationDays: 30 regardless of what the backend actually
     supports (confirmed real: ALLOWED_COINS = [EXALT, USDT, BNB],
     ALLOWED_DURATIONS = [30, 60, 90, 180, 365] in
     controllers/stakingController.js) - the backend was always
     capable of real selection, only the frontend never offered it.

  2. handleUnstake/handleClaimRewards sent an EMPTY request body to
     endpoints that REQUIRE req.body.stakeId (confirmed via
     ensureObjectId(req.body.stakeId, "stake id") in the real
     unstakeCoins/claimRewards controllers, which throws if missing) -
     meaning these two buttons were guaranteed to fail with a 400
     error on every single click. Real per-stake actions, keyed by
     the stake's real _id, replace them.

  3. The default stats state included a hardcoded apr: 15, and
     loadStats() called GET /api/staking/stats - a route that does
     not exist anywhere in routes/stakingRoutes.js (confirmed: only
     /stake, /my-stakes, /:id, /claim, /unstake are real). That call
     always 404s, silently, leaving the fake 15% permanently
     displayed. Real stats are now derived client-side from the real,
     live GET /api/staking/my-stakes response instead - no new
     backend endpoint was needed.
*/

// Mirrors controllers/stakingController.js's real ALLOWED_COINS /
// ALLOWED_DURATIONS / getApyByDuration exactly, for display/preview
// purposes only - the backend independently re-validates and
// re-computes both on every real request, so this frontend copy can
// never itself grant an unsupported coin, duration, or APY.
const SUPPORTED_COINS = ["EXALT", "USDT", "BNB"];
const DURATION_APY_MAP = { 30: 8, 60: 10, 90: 12, 180: 16, 365: 20 };
const SUPPORTED_DURATIONS = Object.keys(DURATION_APY_MAP).map(Number);

export default function Staking() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState("staking");
  const tabGroupId = useId();
  const tabRefs = useRef({});

  const [amount, setAmount] = useState("");
  const [selectedCoin, setSelectedCoin] = useState("EXALT");
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [stakes, setStakes] = useState([]);
  const [stakesLoadState, setStakesLoadState] = useState("loading");
  const [actionState, setActionState] = useState({});

  useEffect(() => {
    loadStakes();
  }, []);

  const loadStakes = async () => {
    setStakesLoadState("loading");

    try {
      const data = await apiFetch("/api/staking/my-stakes");

      setStakes(
        Array.isArray(data?.stakes)
          ? data.stakes
          : []
      );
      setStakesLoadState("ready");
    } catch (err) {
      console.log(err);
      setStakesLoadState("unavailable");
    }
  };

  // Real stats derived from the real, live stakes list - never a
  // fabricated or stale placeholder.
  const derivedStats = useMemo(() => {
    const activeStakes = stakes.filter((s) => s.status === "active");

    const totalActivePrincipal = activeStakes.reduce(
      (sum, s) => sum + Number(s.amount || 0),
      0
    );

    const totalPendingReward = activeStakes.reduce(
      (sum, s) => sum + Number(s.pendingReward || 0),
      0
    );

    const totalClaimedReward = stakes.reduce(
      (sum, s) => sum + Number(s.claimedReward || 0),
      0
    );

    // Weighted APR only where it's genuinely derivable (principal >
    // 0) - never fabricated as a flat number.
    const weightedApy =
      totalActivePrincipal > 0
        ? activeStakes.reduce(
            (sum, s) => sum + Number(s.amount || 0) * Number(s.apy || 0),
            0
          ) / totalActivePrincipal
        : null;

    return {
      totalActivePrincipal,
      totalPendingReward,
      totalClaimedReward,
      activeCount: activeStakes.length,
      weightedApy,
    };
  }, [stakes]);

  const handleStake = async () => {
    try {
      if (!amount || Number(amount) <= 0) {
        alert(t("enterValidStakeAmount"));
        return;
      }

      const data = await apiFetch(
        "/api/staking/stake",
        {
          method: "POST",
          body: JSON.stringify({
            amount: Number(amount),
            durationDays: selectedDuration,
            coin: selectedCoin,
          }),
        }
      );

      alert(data?.message || t("stakingStartedSuccessfully"));
      setAmount("");
      loadStakes();
    } catch (err) {
      alert(err.response?.data?.message || t("stakingFailed"));
    }
  };

  const handleUnstake = async (stakeId) => {
    setActionState((prev) => ({ ...prev, [stakeId]: "unstaking" }));

    try {
      const data = await apiFetch(
        "/api/staking/unstake",
        {
          method: "POST",
          body: JSON.stringify({ stakeId }),
        }
      );

      alert(data?.message || t("unstakedSuccessfully"));
      loadStakes();
    } catch (err) {
      alert(err.response?.data?.message || t("unstakeFailed"));
    } finally {
      setActionState((prev) => ({ ...prev, [stakeId]: null }));
    }
  };

  const handleClaimRewards = async (stakeId) => {
    setActionState((prev) => ({ ...prev, [stakeId]: "claiming" }));

    try {
      const data = await apiFetch(
        "/api/staking/claim",
        {
          method: "POST",
          body: JSON.stringify({ stakeId }),
        }
      );

      alert(data?.message || t("rewardsClaimedSuccessfully"));
      loadStakes();
    } catch (err) {
      alert(err.response?.data?.message || t("claimRewardsFailed"));
    } finally {
      setActionState((prev) => ({ ...prev, [stakeId]: null }));
    }
  };

  return (
    <div className="staking-page">
      <div className="ex2-tabs staking-tabs" role="tablist" aria-label="Staking and Earned EXALT">
        {[["staking", "Staking"], ["earned", "Earned EXALT"]].map(([id, label]) => (
          <button
            key={id}
            ref={(element) => { tabRefs.current[id] = element; }}
            id={`${tabGroupId}-tab-${id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            aria-controls={`${tabGroupId}-panel-${id}`}
            tabIndex={activeTab === id ? 0 : -1}
            className={`ex2-tabs__tab ${activeTab === id ? "ex2-tabs__tab--active" : ""}`}
            onClick={() => setActiveTab(id)}
            onKeyDown={(event) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const next = event.key === "Home" ? "staking" : event.key === "End" ? "earned" : id === "staking" ? "earned" : "staking";
              setActiveTab(next);
              tabRefs.current[next]?.focus();
            }}
          >{label}</button>
        ))}
      </div>
      <div id={`${tabGroupId}-panel-staking`} role="tabpanel" aria-labelledby={`${tabGroupId}-tab-staking`} hidden={activeTab !== "staking"} tabIndex={0}>
      <div className="staking-header">
        <h1>{t("exaltStaking")}</h1>
        <p>{t("stakingSubtitle")}</p>
      </div>

      <div className="staking-cards">
        <div className="staking-card">
          <h2>{t("totalStaked")}</h2>
          <h1>{derivedStats.totalActivePrincipal.toFixed(4)}</h1>
        </div>

        <div className="staking-card">
          <h2>{t("estimatedApr")}</h2>
          <h1>
            {derivedStats.weightedApy === null
              ? t("unavailable")
              : `${derivedStats.weightedApy.toFixed(2)}%`}
          </h1>
        </div>

        <div className="staking-card">
          <h2>{t("rewardsEarned")}</h2>
          <h1>{derivedStats.totalPendingReward.toFixed(4)}</h1>
        </div>
      </div>

      <div className="stake-box">
        <h2>{t("stakeExalt")}</h2>

        <select
          className="staking-select"
          value={selectedCoin}
          onChange={(e) => setSelectedCoin(e.target.value)}
          aria-label={t("coin")}
        >
          {SUPPORTED_COINS.map((coin) => (
            <option key={coin} value={coin}>
              {coin}
            </option>
          ))}
        </select>

        <select
          className="staking-select"
          value={selectedDuration}
          onChange={(e) => setSelectedDuration(Number(e.target.value))}
          aria-label={t("duration")}
        >
          {SUPPORTED_DURATIONS.map((days) => (
            <option key={days} value={days}>
              {days} {t("days")} — {DURATION_APY_MAP[days]}% {t("apy")}
            </option>
          ))}
        </select>

        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={t("enterStakeAmount")}
        />

        <div className="stake-buttons">
          <button className="stake-btn" onClick={handleStake}>
            {t("stake")}
          </button>
        </div>
      </div>

      <div className="stakes-table-box">
        <h2>{t("activeStakes")}</h2>

        <table className="stakes-table">
          <thead>
            <tr>
              <th>{t("coin")}</th>
              <th>{t("amount")}</th>
              <th>{t("apy")}</th>
              <th>{t("duration")}</th>
              <th>{t("pendingReward")}</th>
              <th>{t("status")}</th>
              <th>{t("actions")}</th>
            </tr>
          </thead>

          <tbody>
            {stakesLoadState === "loading" ? (
              <tr>
                <td colSpan="7">{t("loading")}</td>
              </tr>
            ) : stakesLoadState === "unavailable" ? (
              <tr>
                <td colSpan="7">{t("unavailable")}</td>
              </tr>
            ) : stakes.length === 0 ? (
              <tr>
                <td colSpan="7">{t("noActiveStakesYet")}</td>
              </tr>
            ) : (
              stakes.map((stake) => (
                <tr key={stake._id}>
                  <td>{stake.coin}</td>
                  <td>{stake.amount}</td>
                  <td>{stake.apy}%</td>
                  <td>
                    {stake.durationDays} {t("days")}
                  </td>
                  <td>
                    {stake.pendingReward || 0} {stake.coin}
                  </td>
                  <td>{stake.status}</td>
                  <td>
                    {stake.status === "active" ? (
                      <div className="stake-row-actions">
                        <button
                          className="claim-btn"
                          disabled={actionState[stake._id] === "claiming"}
                          onClick={() => handleClaimRewards(stake._id)}
                        >
                          {actionState[stake._id] === "claiming"
                            ? t("loading")
                            : t("claimRewards")}
                        </button>
                        <button
                          className="unstake-btn"
                          disabled={actionState[stake._id] === "unstaking"}
                          onClick={() => handleUnstake(stake._id)}
                        >
                          {actionState[stake._id] === "unstaking"
                            ? t("loading")
                            : t("unstake")}
                        </button>
                      </div>
                    ) : (
                      <span className="stake-status-note">
                        {stake.status === "completed"
                          ? t("stakeCompleted")
                          : stake.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>
      <div id={`${tabGroupId}-panel-earned`} role="tabpanel" aria-labelledby={`${tabGroupId}-tab-earned`} hidden={activeTab !== "earned"} tabIndex={0}>
        {activeTab === "earned" && (
          <CapabilityGate moduleKey="earnedExalt">
            <EarnedExaltPanel />
          </CapabilityGate>
        )}
      </div>
    </div>
  );
}
