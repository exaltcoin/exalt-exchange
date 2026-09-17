import { useCallback, useEffect, useState } from "react";
import { useI18n } from "../i18n/index.js";
import { API_ORIGIN } from "../lib/apiClient";
import {
  PageContainer,
  Section,
  Stack,
  DataTable,
  Badge,
  SkeletonText,
  EmptyState,
} from "../design-system/index.js";

/*
  Batch 6 rewrite. The previous Rewards.jsx was entirely fabricated:
  a hardcoded "Available: 1,250 EXALT" balance, a hardcoded
  "Status: Active", a "Claim Rewards" button whose onClick was
  `() => alert("Reward claim request submitted")` with NO backend
  call at all, and a "Community Tasks" section (Join Telegram: 100
  EXALT, Follow X: 100 EXALT, Invite Friend: 250 EXALT) with a
  "Submit Task" button behaving identically - a fake alert, nothing
  real. Confirmed by search: zero backend support exists anywhere for
  a community-task-reward system.

  This rewrite aggregates only real, backend-confirmed reward
  sources, per BATCH6-MINING-TRUTH-AUDIT.md's conclusion:

  - Referral rewards: real, GET /api/referrals/me - confirmed
    genuinely centralized (approval credits UserWallet.balances.EXALT
    via a real, tested, idempotent, ledger-backed path -
    tests/referralRewardApproval.test.js, 6/6 passing).
  - Staking rewards: real, GET /api/staking/my-stakes - confirmed
    genuinely centralized (claim credits the real wallet via
    getOrCreateWallet/setAvailableBalance with a real
    createStakingLedger entry, idempotent).
  - Mining: NOT included. Confirmed by exhaustive search (the mining
    truth audit) that zero mining contract integration exists
    anywhere in this codebase - not partial, not stubbed, genuinely
    absent. Showing a "Mining: not connected" placeholder here would
    itself be inventing a feature shape for something with no real
    backend or on-chain groundwork today, unlike a genuine
    provider-ready architecture (e.g. CFD/TradFi in Batch 5).
  - "Community Tasks": NOT included, for the same reason - no real
    backend exists.

  Both real sources use their own per-item claim actions on their
  OWN real pages (Staking.jsx's per-stake claim, already fixed this
  batch) - this page is a real read-only aggregation/summary, not a
  duplicate claim surface, avoiding a second place that could drift
  out of sync with the actual claim logic.
*/

function Rewards() {
  const { t } = useI18n();
  const API = API_ORIGIN;

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

  const [referral, setReferral] = useState(null);
  const [referralLoadState, setReferralLoadState] = useState("loading");

  const [stakes, setStakes] = useState([]);
  const [stakingLoadState, setStakingLoadState] = useState("loading");

  const loadReferral = useCallback(async () => {
    setReferralLoadState("loading");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API}/api/referrals/me`, {
        headers: { Authorization: `Bearer ${token || ""}` },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.success) {
        setReferralLoadState("unavailable");
        return;
      }

      setReferral(data.referral);
      setReferralLoadState("ready");
    } catch (error) {
      console.error("Failed to load referral rewards:", error);
      setReferralLoadState("unavailable");
    }
  }, [API]);

  const loadStakes = useCallback(async () => {
    setStakingLoadState("loading");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API}/api/staking/my-stakes`, {
        headers: { Authorization: `Bearer ${token || ""}` },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.success) {
        setStakingLoadState("unavailable");
        return;
      }

      setStakes(data.stakes || []);
      setStakingLoadState("ready");
    } catch (error) {
      console.error("Failed to load staking rewards:", error);
      setStakingLoadState("unavailable");
    }
  }, [API]);

  useEffect(() => {
    loadReferral();
    loadStakes();
  }, [loadReferral, loadStakes]);

  // Real rows, one per real reward record - never an aggregated
  // fake balance. Referral rewards come from the user's real
  // referralRewards array; staking rewards come from each real
  // stake's real, live-computed pendingReward.
  const referralRows = (referral?.rewards || []).map((reward) => ({
    id: reward._id,
    source: translateWithFallback("referral", "Referral", "social"),
    asset: reward.coin || "EXALT",
    amount: reward.rewardAmount,
    status: reward.status,
    date: reward.createdAt,
  }));

  const stakingRows = stakes
    .filter((stake) => Number(stake.pendingReward || 0) > 0)
    .map((stake) => ({
      id: stake._id,
      source: translateWithFallback("staking", "Staking", "staking"),
      asset: stake.coin,
      amount: stake.pendingReward,
      status: stake.status,
      date: stake.createdAt,
    }));

  const allRows = [...referralRows, ...stakingRows];
  const isLoading =
    referralLoadState === "loading" || stakingLoadState === "loading";
  const bothUnavailable =
    referralLoadState === "unavailable" && stakingLoadState === "unavailable";

  return (
    <PageContainer maxWidth="900px">
      <Stack gap="6">
        <Section
          title={translateWithFallback("rewardsCenter", "Rewards Center")}
        >
          {isLoading ? (
            <SkeletonText lines={3} />
          ) : bothUnavailable ? (
            <EmptyState
              title={translateWithFallback(
                "rewardsUnavailable",
                "Unable to load your rewards right now."
              )}
            />
          ) : allRows.length === 0 ? (
            <EmptyState
              title={translateWithFallback(
                "noRewardsYet",
                "No rewards yet."
              )}
              description={translateWithFallback(
                "noRewardsYetDescription",
                "Real referral and staking rewards will appear here once you earn them."
              )}
            />
          ) : (
            <DataTable
              ariaLabel={translateWithFallback(
                "rewardsCenter",
                "Rewards Center"
              )}
              rows={allRows}
              getRowKey={(row) => row.id}
              columns={[
                {
                  key: "source",
                  header: translateWithFallback("source", "Source"),
                },
                {
                  key: "asset",
                  header: translateWithFallback("coin", "Coin"),
                },
                {
                  key: "amount",
                  header: translateWithFallback("amount", "Amount"),
                  align: "end",
                },
                {
                  key: "status",
                  header: translateWithFallback("status", "Status"),
                },
                {
                  key: "date",
                  header: translateWithFallback("date", "Date"),
                },
              ]}
              renderCell={(row, column) => {
                if (column.key === "status") {
                  return <Badge tone="neutral">{row.status}</Badge>;
                }
                if (column.key === "date") {
                  return row.date
                    ? new Date(row.date).toLocaleDateString()
                    : "\u2014";
                }
                return row[column.key];
              }}
            />
          )}
        </Section>

        {/*
          Mining and "Community Tasks" are deliberately absent - see
          this component's header comment and
          BATCH6-MINING-TRUTH-AUDIT.md for the full reasoning. Not an
          oversight; a documented, audited omission.
        */}
      </Stack>
    </PageContainer>
  );
}

export default Rewards;
