import { useCallback, useEffect, useState } from "react";
import { useI18n } from "../i18n/index.js";
import { API_ORIGIN } from "../lib/apiClient";
import {
  PageContainer,
  Section,
  Stack,
  EmptyState,
  Badge,
  SkeletonText,
} from "../design-system/index.js";

/*
  Batch 5 (Part B): the real TradFi/CFD module shell. Talks only to
  the real GET /api/cfd/status and GET /api/cfd/instruments endpoints
  (routes/cfdRoutes.js), which themselves talk only to the real
  TradFiProvider interface via the provider registry - currently
  always the honest NullProvider, since no real broker/liquidity
  provider is connected. This page shows exactly what that reports:
  a real "not connected" state and a genuinely empty instrument list.
  No fabricated Forex/Metals/Indices/Stocks/Crypto CFD cards, no
  random/generated quotes - see services/cfd/nullProvider.js and
  tests/cfdProviderArchitecture.test.js for the backend side of this
  same honesty guarantee.
*/

function TradFi() {
  const { t } = useI18n();
  const API = API_ORIGIN;

  const translateWithFallback = (key, fallback, namespace = "trading") => {
    try {
      const value = t(key, { ns: namespace, defaultValue: fallback });
      return value === undefined || value === null || value === key
        ? fallback
        : value;
    } catch (error) {
      return fallback;
    }
  };

  const [providerState, setProviderState] = useState(null);
  const [statusLoadState, setStatusLoadState] = useState("loading");

  const loadStatus = useCallback(async () => {
    setStatusLoadState("loading");

    try {
      const response = await fetch(`${API}/api/cfd/status`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.success) {
        setStatusLoadState("unavailable");
        return;
      }

      setProviderState(data);
      setStatusLoadState("ready");
    } catch (error) {
      console.error("Failed to load CFD provider status:", error);
      setStatusLoadState("unavailable");
    }
  }, [API]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const stateTone = {
    NOT_CONFIGURED: "neutral",
    CONNECTING: "warning",
    READY: "success",
    DEGRADED: "warning",
    DISABLED: "neutral",
  };

  return (
    <PageContainer maxWidth="900px">
      <Stack gap="6">
        <Section
          title={translateWithFallback("tradFi", "TradFi / CFD")}
        >
          {statusLoadState === "loading" ? (
            <SkeletonText lines={2} />
          ) : statusLoadState === "unavailable" ? (
            <EmptyState
              title={translateWithFallback(
                "tradFiStatusUnavailable",
                "Unable to load TradFi provider status right now."
              )}
            />
          ) : (
            <Stack gap="3">
              <Badge tone={stateTone[providerState.providerState] || "neutral"}>
                {providerState.providerState}
              </Badge>
              <p className="ex2-text-secondary">{providerState.message}</p>
            </Stack>
          )}
        </Section>

        <Section
          title={translateWithFallback("instruments", "Instruments")}
        >
          {/*
            Deliberately no instrument list is rendered here at all
            while the provider is NOT_CONFIGURED - the real
            GET /api/cfd/instruments endpoint would return an
            honestly empty array right now, and rendering an empty
            table/grid for a "browse instruments" section would read
            as a bug rather than the real, current state of this
            module. The EmptyState below IS the honest state.
          */}
          <EmptyState
            title={translateWithFallback(
              "tradFiNoProvider",
              "No CFD/TradFi liquidity provider is connected yet."
            )}
            description={translateWithFallback(
              "tradFiNoProviderDescription",
              "This module is provider-ready staging architecture. Forex, Metals, Indices, Stocks, and Crypto CFD instruments will appear here once a real broker/liquidity provider is connected and verified."
            )}
          />
        </Section>
      </Stack>
    </PageContainer>
  );
}

export default TradFi;
