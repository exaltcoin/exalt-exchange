import { useCallback, useEffect, useState } from "react";
import { useI18n } from "../i18n/index.js";
import { API_ORIGIN } from "../lib/apiClient";
import { useDisplayCurrency } from "../hooks/useDisplayCurrency.js";
import {
  PageContainer,
  Section,
  Stack,
  Grid,
  Toolbar,
  DataTable,
  Badge,
  Button,
  SkeletonText,
  Select,
  SearchInput,
} from "../design-system/index.js";

/*
  Batch 2: real Assets screen. Built as a new component rather than
  modifying Wallets.jsx (a protected file with no seam to extend -
  app.jsx renders it as a bare `<Wallets />` with no wrapper). Wallets.jsx
  remains fully reachable elsewhere (the full nav menu still has its
  own entry) - this does not replace or remove it, it adds a second,
  purpose-built real screen for the Home/bottom-nav "Assets" destination.

  Account structure follows docs/BATCH2-ACCOUNT-MODEL-AUDIT.md exactly:
  two real buckets (Wallet: balances/locked, Futures: futuresBalance/
  futuresLocked) - no fabricated "Funding Account" or "Unified Account"
  concept, since neither exists in the real backend schema.
*/

const SUPPORTED_COINS = ["USDT", "BNB", "EXALT"];

function Assets({ setPage }) {
  const { t } = useI18n();
  const API = API_ORIGIN;

  const translateWithFallback = (key, fallback, namespace = "wallets") => {
    try {
      const value = t(key, { ns: namespace, defaultValue: fallback });
      return value === undefined || value === null || value === key
        ? fallback
        : value;
    } catch (error) {
      return fallback;
    }
  };

  const {
    displayCurrency,
    setDisplayCurrency,
    btcPriceLoadState,
    convertForDisplay,
  } = useDisplayCurrency();

  const [balancesHidden, setBalancesHidden] = useState(() => {
    try {
      return localStorage.getItem("exalt_balances_hidden") === "true";
    } catch (error) {
      return false;
    }
  });

  const [walletBalances, setWalletBalances] = useState({});
  const [walletLocked, setWalletLocked] = useState({});
  const [futuresBalance, setFuturesBalance] = useState(0);
  const [futuresLocked, setFuturesLocked] = useState(0);
  const [walletLoadState, setWalletLoadState] = useState("loading");

  const [bnbPrice, setBnbPrice] = useState(null);
  const [exaltPrice, setExaltPrice] = useState(null);
  const [priceLoadState, setPriceLoadState] = useState("loading");

  const [search, setSearch] = useState("");

  const loadWallet = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setWalletLoadState("unavailable");
      return;
    }

    setWalletLoadState("loading");

    try {
      const response = await fetch(`${API}/api/wallets/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.success) {
        setWalletLoadState("unavailable");
        return;
      }

      setWalletBalances(data.wallet?.balances || {});
      setWalletLocked(data.wallet?.locked || {});
      setFuturesBalance(Number(data.wallet?.futuresBalance?.USDT || 0));
      setFuturesLocked(Number(data.wallet?.futuresLocked?.USDT || 0));
      setWalletLoadState("ready");
    } catch (error) {
      console.error("Failed to load wallet:", error);
      setWalletLoadState("unavailable");
    }
  }, [API]);

  const loadPrices = useCallback(async () => {
    setPriceLoadState("loading");

    try {
      const response = await fetch(`${API}/api/market/live`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !Array.isArray(data?.pairs)) {
        setPriceLoadState("unavailable");
        return;
      }

      const bnbPair = data.pairs.find((p) => p.symbol === "BNBUSDT");
      const exaltPair = data.pairs.find((p) => p.symbol === "EXALTUSDT");

      setBnbPrice(
        bnbPair && Number(bnbPair.price) > 0 ? Number(bnbPair.price) : null
      );
      setExaltPrice(
        exaltPair && Number(exaltPair.price) > 0
          ? Number(exaltPair.price)
          : null
      );
      setPriceLoadState("ready");
    } catch (error) {
      console.error("Failed to load market prices:", error);
      setPriceLoadState("unavailable");
    }
  }, [API]);

  useEffect(() => {
    loadWallet();
    loadPrices();
  }, [loadWallet, loadPrices]);

  // Same real "only value a coin with a real live price - never $0
  // or fabricated" rule as Dashboard.jsx's identical logic.
  const coinPriceMap = {
    USDT: 1,
    BNB: bnbPrice,
    EXALT: exaltPrice,
  };

  const valueOf = (coin, amount) => {
    const price = coinPriceMap[coin];
    if (!Number.isFinite(price) || price === null) {
      return null;
    }
    return Number(amount || 0) * price;
  };

  const totalWalletValue = SUPPORTED_COINS.reduce((sum, coin) => {
    const value = valueOf(coin, walletBalances[coin]);
    return value === null ? sum : sum + value;
  }, 0);

  const totalLockedValue = SUPPORTED_COINS.reduce((sum, coin) => {
    const value = valueOf(coin, walletLocked[coin]);
    return value === null ? sum : sum + value;
  }, 0);

  const totalAssetsValue = totalWalletValue + futuresBalance;

  const formatDisplayValue = (usdValue) => {
    const converted = convertForDisplay(usdValue);

    if (converted === null) {
      return translateWithFallback("unavailable", "Unavailable", "dashboard");
    }

    if (displayCurrency === "BTC") {
      return `${converted.toFixed(8)} BTC`;
    }

    const symbol = displayCurrency === "USDT" ? "" : "$";
    const suffix = displayCurrency === "USDT" ? " USDT" : "";
    return `${symbol}${converted.toFixed(2)}${suffix}`;
  };

  const maskOrValue = (formatted) =>
    balancesHidden ? "\u2022\u2022\u2022\u2022\u2022\u2022" : formatted;

  const searchLower = search.trim().toLowerCase();
  const filteredCoins = SUPPORTED_COINS.filter(
    (coin) => !searchLower || coin.toLowerCase().includes(searchLower)
  );

  const assetRows = filteredCoins.map((coin) => ({
    coin,
    balance: Number(walletBalances[coin] || 0),
    locked: Number(walletLocked[coin] || 0),
    usdValue: valueOf(coin, walletBalances[coin]),
  }));

  return (
    <PageContainer maxWidth="1000px">
      <Stack gap="8">
        <Section
          title={translateWithFallback("totalAssets", "Total Assets")}
          action={
            <Toolbar>
              <Select
                value={displayCurrency}
                onChange={(event) => setDisplayCurrency(event.target.value)}
                aria-label={translateWithFallback(
                  "displayCurrency",
                  "Display currency",
                  "dashboard"
                )}
              >
                <option value="USD">USD</option>
                <option value="USDT">USDT</option>
                <option value="BTC">BTC</option>
              </Select>

              <Button
                variant="ghost"
                size="sm"
                aria-label={
                  balancesHidden
                    ? translateWithFallback(
                        "showBalances",
                        "Show balances",
                        "dashboard"
                      )
                    : translateWithFallback(
                        "hideBalances",
                        "Hide balances",
                        "dashboard"
                      )
                }
                onClick={() => {
                  setBalancesHidden((hidden) => {
                    const next = !hidden;
                    try {
                      localStorage.setItem(
                        "exalt_balances_hidden",
                        next ? "true" : "false"
                      );
                    } catch (error) {
                      // Non-fatal, same reasoning as Dashboard.jsx.
                    }
                    return next;
                  });
                }}
              >
                {balancesHidden ? "\ud83d\udc41\ufe0f\u200d\ud83d\udde8\ufe0f" : "\ud83d\udc41\ufe0f"}
              </Button>
            </Toolbar>
          }
        >
          <Grid minItemWidth="200px" gap="4">
            <div>
              <div className="ex2-text-secondary ex2-text-sm">
                {translateWithFallback("totalAssets", "Total Assets")}
              </div>
              {walletLoadState === "loading" ||
              priceLoadState === "loading" ||
              (displayCurrency === "BTC" &&
                btcPriceLoadState === "loading") ? (
                <SkeletonText lines={1} />
              ) : walletLoadState === "unavailable" ? (
                <Badge tone="neutral">
                  {translateWithFallback(
                    "unavailable",
                    "Unavailable",
                    "dashboard"
                  )}
                </Badge>
              ) : (
                <div className="ex2-text-2xl ex2-nums">
                  {maskOrValue(formatDisplayValue(totalAssetsValue))}
                </div>
              )}
            </div>

            <div>
              <div className="ex2-text-secondary ex2-text-sm">
                {translateWithFallback("availableBalance", "Available")}
              </div>
              {walletLoadState === "loading" ? (
                <SkeletonText lines={1} />
              ) : (
                <div className="ex2-text-2xl ex2-nums">
                  {maskOrValue(
                    formatDisplayValue(totalWalletValue - totalLockedValue)
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="ex2-text-secondary ex2-text-sm">
                {translateWithFallback("lockedBalance", "In Use / Locked")}
              </div>
              {walletLoadState === "loading" ? (
                <SkeletonText lines={1} />
              ) : (
                <div className="ex2-text-2xl ex2-nums">
                  {maskOrValue(formatDisplayValue(totalLockedValue))}
                </div>
              )}
            </div>
          </Grid>
        </Section>

        {/*
          Real Wallet section - the centralized balances/locked
          bucket. Covers what "Funding" or "Spot/Trading" would show
          in the product spec, since they are the same real backend
          bucket (see docs/BATCH2-ACCOUNT-MODEL-AUDIT.md) - not
          presented as two separate account types that don't exist.
        */}
        <Section
          title={translateWithFallback("wallet", "Wallet")}
          action={
            <Toolbar>
              <SearchInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={translateWithFallback(
                  "searchAssets",
                  "Search assets",
                  "common"
                )}
                aria-label={translateWithFallback(
                  "searchAssets",
                  "Search assets",
                  "common"
                )}
              />
              <Button size="sm" onClick={() => setPage("wallets")}>
                {translateWithFallback("deposit", "Deposit")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage("wallets")}
              >
                {translateWithFallback("withdraw", "Withdraw")}
              </Button>
            </Toolbar>
          }
        >
          <DataTable
            ariaLabel={translateWithFallback("wallet", "Wallet")}
            loading={walletLoadState === "loading"}
            rows={assetRows}
            getRowKey={(row) => row.coin}
            emptyTitle={translateWithFallback(
              "noAssetsFound",
              "No assets found.",
              "common"
            )}
            columns={[
              { key: "coin", header: translateWithFallback("coin", "Coin", "common") },
              {
                key: "balance",
                header: translateWithFallback("balance", "Balance", "common"),
                align: "end",
              },
              {
                key: "locked",
                header: translateWithFallback("lockedBalance", "In Use / Locked"),
                align: "end",
              },
              {
                key: "usdValue",
                header: translateWithFallback("value", "Value", "common"),
                align: "end",
              },
            ]}
            renderCell={(row, column) => {
              if (balancesHidden && column.key !== "coin") {
                return "\u2022\u2022\u2022\u2022\u2022\u2022";
              }
              if (column.key === "usdValue") {
                return row.usdValue === null
                  ? translateWithFallback(
                      "unavailable",
                      "Unavailable",
                      "dashboard"
                    )
                  : formatDisplayValue(row.usdValue);
              }
              return row[column.key];
            }}
          />
        </Section>

        {/*
          Real Futures section - genuinely separate from Wallet per
          the account model audit (futuresBalance/futuresLocked are
          distinct schema fields, unlike the fabricated "Funding
          Account" concept this screen deliberately does not show).
        */}
        <Section
          title={translateWithFallback("futures", "Futures", "navigation")}
        >
          <Grid minItemWidth="200px" gap="4">
            <div>
              <div className="ex2-text-secondary ex2-text-sm">
                {translateWithFallback("availableBalance", "Available")}
              </div>
              {walletLoadState === "loading" ? (
                <SkeletonText lines={1} />
              ) : (
                <div className="ex2-text-lg ex2-nums">
                  {maskOrValue(formatDisplayValue(futuresBalance))}
                </div>
              )}
            </div>

            <div>
              <div className="ex2-text-secondary ex2-text-sm">
                {translateWithFallback("lockedBalance", "In Use / Locked")}
              </div>
              {walletLoadState === "loading" ? (
                <SkeletonText lines={1} />
              ) : (
                <div className="ex2-text-lg ex2-nums">
                  {maskOrValue(formatDisplayValue(futuresLocked))}
                </div>
              )}
            </div>
          </Grid>

          <Toolbar>
            <Button size="sm" onClick={() => setPage("futures")}>
              {translateWithFallback(
                "manageFutures",
                "Manage Futures",
                "trading"
              )}
            </Button>
            {/*
              Batch 3: unlike Batch 1's finding (no reachable
              transfer UI existed anywhere), Spot<->Futures transfer
              is now confirmed real, tested, and reachable - the
              Futures page (Batch 2's "Manage Futures" link) already
              has a real transfer control wired to the exact same
              tested POST /api/futures/transfer endpoint
              (tests/futuresInternalTransfer.test.js). This gives it
              a second, more discoverable entry point from Assets
              rather than duplicating the transfer UI/logic itself
              in a second place.
            */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage("futures")}
            >
              {translateWithFallback("transfer", "Transfer")}
            </Button>
          </Toolbar>
        </Section>

        {/* ---------- Real transaction/history entry points ---------- */}
        <Section
          title={translateWithFallback(
            "transactionHistory",
            "Transaction History",
            "trading"
          )}
        >
          <Toolbar>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage("transactions")}
            >
              {translateWithFallback("deposits", "Deposits", "trading")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage("transactions")}
            >
              {translateWithFallback("withdrawals", "Withdrawals", "trading")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage("orders")}
            >
              {translateWithFallback("trades", "Trades", "trading")}
            </Button>
          </Toolbar>
        </Section>
      </Stack>
    </PageContainer>
  );
}

export default Assets;
