import { useCallback, useEffect, useState } from "react";
import { API_ORIGIN } from "../lib/apiClient";

/*
  Batch 2: extracted from Dashboard.jsx's Batch 1 implementation so
  every screen that needs USD/USDT/BTC display conversion (Dashboard,
  Assets, and any future screen) shares one real conversion path
  instead of each maintaining its own copy - "one canonical
  conversion utility/state path should be used where practical."

  Real behavior, unchanged from Batch 1:
  - USD/USDT share the same real-dollar figure under this codebase's
    existing 1:1 peg assumption (already used throughout the wallet
    displays this reuses data from).
  - BTC requires a real price, fetched from
    GET /api/market/reference-price/BTC (services/walletPriceService.js
    on the backend - the same service Web3 wallet valuation uses).
  - convertForDisplay never fabricates a value: returns null when a
    BTC price isn't available yet, and callers must render an
    explicit "unavailable" state for null, never a silent 0 or the
    raw USD figure relabeled.
  - The currency SELECTION is a UI preference (persisted in
    localStorage under the same key Dashboard.jsx used, so a
    selection made on one screen persists to the other) - the VALUES
    shown are always computed live from real data.
*/

const STORAGE_KEY = "exalt_display_currency";
const SUPPORTED_CURRENCIES = ["USD", "USDT", "BTC"];

export function useDisplayCurrency() {
  const API = API_ORIGIN;

  const [displayCurrency, setDisplayCurrency] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return SUPPORTED_CURRENCIES.includes(stored) ? stored : "USD";
    } catch (error) {
      return "USD";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, displayCurrency);
    } catch (error) {
      // Non-fatal - private browsing / storage unavailable. The
      // selection still works for the current session.
    }
  }, [displayCurrency]);

  const [btcPriceUsd, setBtcPriceUsd] = useState(null);
  const [btcPriceLoadState, setBtcPriceLoadState] = useState("loading");

  const loadBtcPrice = useCallback(async () => {
    setBtcPriceLoadState("loading");

    try {
      const response = await fetch(
        `${API}/api/market/reference-price/BTC`
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.success) {
        setBtcPriceLoadState("unavailable");
        return;
      }

      setBtcPriceUsd(Number(data.priceUsd));
      setBtcPriceLoadState("ready");
    } catch (error) {
      console.error("Failed to load BTC reference price:", error);
      setBtcPriceLoadState("unavailable");
    }
  }, [API]);

  useEffect(() => {
    if (displayCurrency === "BTC") {
      loadBtcPrice();
    }
  }, [displayCurrency, loadBtcPrice]);

  const convertForDisplay = useCallback(
    (usdValue) => {
      if (displayCurrency === "BTC") {
        if (btcPriceLoadState !== "ready" || !btcPriceUsd) {
          return null;
        }
        return usdValue / btcPriceUsd;
      }

      return usdValue;
    },
    [displayCurrency, btcPriceLoadState, btcPriceUsd]
  );

  return {
    displayCurrency,
    setDisplayCurrency,
    supportedCurrencies: SUPPORTED_CURRENCIES,
    btcPriceLoadState,
    convertForDisplay,
    isValueUnavailable:
      displayCurrency === "BTC" && btcPriceLoadState !== "ready",
  };
}

export default useDisplayCurrency;
